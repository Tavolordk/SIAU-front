# ========================
#   BUILD
# ========================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
ARG PROJECT
COPY . .
RUN dotnet restore "$PROJECT" \
 && dotnet publish "$PROJECT" -c Release -o /app/publish -p:PublishTrimmed=false

# ========================
#   RUNTIME
# ========================
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

# Healthcheck (ajusta ruta si tu API no expone /healthz)
HEALTHCHECK --interval=20s --timeout=3s --retries=5 \
 CMD wget -qO- http://localhost:8080/healthz || exit 1

COPY --from=build /app/publish ./
# Arranca el primer *.Api.dll o cualquier dll que contenga 'captcha'
CMD ["sh","-lc","dotnet $(ls | grep -Ei '.*\\.Api\\.dll$|.*captcha.*\\.dll$' | head -n1)"]