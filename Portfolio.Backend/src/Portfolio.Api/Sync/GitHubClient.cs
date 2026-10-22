using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using Portfolio.Api.Entities;

namespace Portfolio.Api.Sync;

public record GitHubRepo(
    long Id,
    string FullName,
    string Name,
    string OwnerLogin,
    bool OwnerIsOrganization,
    string Url,
    string? Homepage,
    string? Description,
    bool IsFork,
    bool IsArchived,
    bool IsPrivate,
    int Stars,
    int Forks,
    DateTimeOffset CreatedAt,
    DateTimeOffset? PushedAt,
    string? PrimaryLanguage,
    List<LanguageStat> Languages,
    List<string> Topics);

public class GitHubClient(HttpClient http, IOptions<GitHubOptions> options, ILogger<GitHubClient> logger)
{
    private const string RepoFields = """
        fragment RepoFields on Repository {
          databaseId nameWithOwner name url homepageUrl description
          isFork isArchived isPrivate stargazerCount forkCount createdAt pushedAt
          owner { login __typename }
          primaryLanguage { name }
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } }
          repositoryTopics(first: 20) { nodes { topic { name } } }
        }
        """;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(options.Value.Token);

    public Task<List<GitHubRepo>> GetOwnedReposAsync(string login, CancellationToken ct) =>
        PaginateAsync("""
            query($login: String!, $cursor: String) {
              user(login: $login) {
                repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, privacy: PUBLIC) {
                  pageInfo { hasNextPage endCursor } nodes { ...RepoFields }
                }
              }
            }
            """, login, d => d["user"]?["repositories"], n => n, ct);

    public Task<List<GitHubRepo>> GetOrganizationReposAsync(string org, CancellationToken ct) =>
        PaginateAsync("""
            query($login: String!, $cursor: String) {
              organization(login: $login) {
                repositories(first: 100, after: $cursor, privacy: PUBLIC) {
                  pageInfo { hasNextPage endCursor } nodes { ...RepoFields }
                }
              }
            }
            """, org, d => d["organization"]?["repositories"], n => n, ct);

    // Repos ajenos con commits, PRs o creados por el usuario (GitHub solo devuelve los recientes)
    public Task<List<GitHubRepo>> GetContributedReposAsync(string login, CancellationToken ct) =>
        PaginateAsync("""
            query($login: String!, $cursor: String) {
              user(login: $login) {
                repositoriesContributedTo(first: 100, after: $cursor, includeUserRepositories: false,
                    contributionTypes: [COMMIT, PULL_REQUEST, REPOSITORY], privacy: PUBLIC) {
                  pageInfo { hasNextPage endCursor } nodes { ...RepoFields }
                }
              }
            }
            """, login, d => d["user"]?["repositoriesContributedTo"], n => n, ct);

    // Todos los PRs que ha abierto el usuario (sin límite de tiempo)
    public Task<List<GitHubRepo>> GetPullRequestReposAsync(string login, CancellationToken ct) =>
        PaginateAsync("""
            query($login: String!, $cursor: String) {
              user(login: $login) {
                pullRequests(first: 100, after: $cursor) {
                  pageInfo { hasNextPage endCursor } nodes { repository { ...RepoFields } }
                }
              }
            }
            """, login, d => d["user"]?["pullRequests"], n => n["repository"], ct);

    // Repos donde aparece como autor de commits (búsqueda REST, cubre contribuciones antiguas)
    public async Task<List<GitHubRepo>> GetCommitAuthorReposAsync(string login, CancellationToken ct)
    {
        var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        for (var page = 1; page <= 3; page++)
        {
            var json = await http.GetFromJsonAsync<JsonNode>(
                $"search/commits?q=author:{Uri.EscapeDataString(login)}&per_page=100&page={page}", ct);
            var items = json?["items"]?.AsArray() ?? [];
            foreach (var item in items)
                if (item?["repository"]?["full_name"]?.GetValue<string>() is { } fullName)
                    names.Add(fullName);
            if (items.Count < 100) break;
        }
        return await GetReposByNameAsync(names, ct);
    }

    public async Task<List<GitHubRepo>> GetReposByNameAsync(IEnumerable<string> fullNames, CancellationToken ct)
    {
        var result = new List<GitHubRepo>();
        foreach (var batch in fullNames.Chunk(30))
        {
            var aliases = batch.Select((fullName, i) =>
            {
                var parts = fullName.Split('/', 2);
                return $"r{i}: repository(owner: {JsonValue.Create(parts[0]).ToJsonString()}, name: {JsonValue.Create(parts[1]).ToJsonString()}) {{ ...RepoFields }}";
            });
            var data = await QueryAsync($"query {{ {string.Join("\n", aliases)} }}", null, allowPartial: true, ct);
            for (var i = 0; i < batch.Length; i++)
                if (data[$"r{i}"] is JsonObject node)
                    result.Add(MapRepo(node));
        }
        return result;
    }

    private async Task<List<GitHubRepo>> PaginateAsync(
        string query, string login,
        Func<JsonNode, JsonNode?> selectConnection,
        Func<JsonNode, JsonNode?> selectRepo,
        CancellationToken ct)
    {
        var repos = new List<GitHubRepo>();
        string? cursor = null;
        do
        {
            var data = await QueryAsync(query, new JsonObject { ["login"] = login, ["cursor"] = cursor }, allowPartial: false, ct);
            var connection = selectConnection(data)
                ?? throw new InvalidOperationException($"GitHub no encontró la cuenta u organización '{login}'.");

            foreach (var node in connection["nodes"]?.AsArray() ?? [])
                if (node is not null && selectRepo(node) is JsonObject repo)
                    repos.Add(MapRepo(repo));

            var pageInfo = connection["pageInfo"]!;
            cursor = pageInfo["hasNextPage"]!.GetValue<bool>() ? pageInfo["endCursor"]!.GetValue<string>() : null;
        } while (cursor is not null);

        return repos;
    }

    private async Task<JsonNode> QueryAsync(string query, JsonObject? variables, bool allowPartial, CancellationToken ct)
    {
        using var response = await http.PostAsJsonAsync("graphql", new { query = RepoFields + query, variables }, ct);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonNode>(ct)
            ?? throw new InvalidOperationException("GitHub devolvió una respuesta vacía.");

        if (json["errors"] is JsonArray { Count: > 0 } errors)
        {
            var message = string.Join(" | ", errors.Select(e => e?["message"]?.GetValue<string>()));
            if (!allowPartial || json["data"] is null)
                throw new InvalidOperationException($"Error de GitHub GraphQL: {message}");
            logger.LogWarning("GitHub GraphQL devolvió errores parciales: {Errors}", message);
        }

        return json["data"] ?? throw new InvalidOperationException("GitHub no devolvió datos.");
    }

    private static GitHubRepo MapRepo(JsonNode r) => new(
        Id: r["databaseId"]!.GetValue<long>(),
        FullName: r["nameWithOwner"]!.GetValue<string>(),
        Name: r["name"]!.GetValue<string>(),
        OwnerLogin: r["owner"]!["login"]!.GetValue<string>(),
        OwnerIsOrganization: r["owner"]!["__typename"]!.GetValue<string>() == "Organization",
        Url: r["url"]!.GetValue<string>(),
        Homepage: r["homepageUrl"]?.GetValue<string>(),
        Description: r["description"]?.GetValue<string>(),
        IsFork: r["isFork"]!.GetValue<bool>(),
        IsArchived: r["isArchived"]!.GetValue<bool>(),
        IsPrivate: r["isPrivate"]!.GetValue<bool>(),
        Stars: r["stargazerCount"]!.GetValue<int>(),
        Forks: r["forkCount"]!.GetValue<int>(),
        CreatedAt: r["createdAt"]!.GetValue<DateTimeOffset>(),
        PushedAt: r["pushedAt"]?.GetValue<DateTimeOffset>(),
        PrimaryLanguage: r["primaryLanguage"]?["name"]?.GetValue<string>(),
        Languages: (r["languages"]?["edges"]?.AsArray() ?? [])
            .Where(e => e is not null)
            .Select(e => new LanguageStat
            {
                Name = e!["node"]!["name"]!.GetValue<string>(),
                Color = e["node"]!["color"]?.GetValue<string>(),
                Bytes = e["size"]!.GetValue<long>()
            }).ToList(),
        Topics: (r["repositoryTopics"]?["nodes"]?.AsArray() ?? [])
            .Select(t => t?["topic"]?["name"]?.GetValue<string>())
            .OfType<string>().ToList());

    public static void Configure(HttpClient http, string? token)
    {
        http.BaseAddress = new Uri("https://api.github.com/");
        http.DefaultRequestHeaders.UserAgent.ParseAdd("nicholas-delarosa-portfolio");
        http.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        http.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
        if (!string.IsNullOrWhiteSpace(token))
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        http.Timeout = TimeSpan.FromSeconds(60);
    }
}
