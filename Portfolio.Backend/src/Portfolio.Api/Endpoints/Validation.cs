using System.Text.RegularExpressions;

namespace Portfolio.Api.Endpoints;

// Junta los errores de validación y los devuelve todos juntos como 400
public partial class Validation
{
    private readonly Dictionary<string, string[]> _errors = [];

    public bool IsValid => _errors.Count == 0;

    public IResult Problem() => Results.ValidationProblem(_errors);

    public Validation Required(string field, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) Add(field, "Es obligatorio.");
        return this;
    }

    public Validation MaxLength(string field, string? value, int max)
    {
        if (value is not null && value.Length > max) Add(field, $"Máximo {max} caracteres.");
        return this;
    }

    public Validation Url(string field, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value) &&
            !(Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == "http" || uri.Scheme == "https")))
            Add(field, "Debe ser una URL http(s) válida.");
        return this;
    }

    public Validation Color(string field, string? value)
    {
        if (value is null || !HexColor().IsMatch(value)) Add(field, "Debe ser un color hexadecimal, ej. #FF77C8.");
        return this;
    }

    public Validation Must(bool condition, string field, string message)
    {
        if (!condition) Add(field, message);
        return this;
    }

    private void Add(string field, string message) =>
        _errors[field] = _errors.TryGetValue(field, out var existing) ? [.. existing, message] : [message];

    public static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [GeneratedRegex("^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")]
    private static partial Regex HexColor();
}
