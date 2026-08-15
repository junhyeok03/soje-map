FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace

COPY pom.xml ./
RUN mvn -B -ntp dependency:go-offline

COPY src ./src
RUN mvn -B -ntp package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /workspace/target/soje-map-backend-*.jar app.jar

ENV SERVER_PORT=8080
EXPOSE 8080

USER 10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
