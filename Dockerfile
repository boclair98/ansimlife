FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN test -s src/main/resources/static/index.html \
    && test -s src/main/resources/static/app.js \
    && mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/target/ansimlife-0.0.1-SNAPSHOT.jar app.jar
COPY --from=build /workspace/src/main/resources/static ./public
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -Dspring.web.resources.static-locations=classpath:/static/,file:/app/public/ -Dspring.web.resources.add-mappings=true -jar /app/app.jar"]
