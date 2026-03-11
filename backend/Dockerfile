FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY CvBuilder.Api/CvBuilder.Api.csproj CvBuilder.Api/
RUN dotnet restore CvBuilder.Api/CvBuilder.Api.csproj
COPY . .
WORKDIR /src/CvBuilder.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5000
ENTRYPOINT ["dotnet", "CvBuilder.Api.dll"]
