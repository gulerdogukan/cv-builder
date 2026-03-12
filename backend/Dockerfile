# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY CvBuilder.Api/CvBuilder.Api.csproj CvBuilder.Api/
RUN dotnet restore CvBuilder.Api/CvBuilder.Api.csproj

COPY . .
WORKDIR /src/CvBuilder.Api
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

COPY --from=build /app/publish .

# Railway / Cloud Run set PORT dynamically; default 8080
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080
ENTRYPOINT ["dotnet", "CvBuilder.Api.dll"]
