FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/Portfolio.Api/Portfolio.Api.csproj src/Portfolio.Api/
RUN dotnet restore src/Portfolio.Api/Portfolio.Api.csproj
COPY src/ src/
RUN dotnet publish src/Portfolio.Api/Portfolio.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Portfolio.Api.dll"]
