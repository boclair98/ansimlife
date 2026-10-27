FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
COPY scripts ./scripts
RUN test -s src/main/resources/static/index.html \
    && test -s src/main/resources/static/app.js \
    && sh scripts/ensure-font-assets.sh
RUN mvn -B -DskipTests clean package
RUN jar tf target/ansimlife-0.0.1-SNAPSHOT.jar > /tmp/ansimlife-jar-entries \
    && grep -Fx BOOT-INF/classes/kr/coders/ansimlife/support/BenefitGuidePdfService.class /tmp/ansimlife-jar-entries

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/target/ansimlife-0.0.1-SNAPSHOT.jar app.jar
COPY --from=build /workspace/src/main/resources/static ./public
COPY --from=build /workspace/src/main/resources/pdf-fonts ./pdf-fonts
RUN test -s /app/pdf-fonts/WantedSans-Regular.ttf \
    && test -s /app/pdf-fonts/WantedSans-Bold.ttf \
    && test -s /app/public/fonts/WantedSansVariable.woff2
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -Dansimlife.pdf.font-directory=/app/pdf-fonts -Dspring.web.resources.static-locations=classpath:/static/,file:/app/public/ -Dspring.web.resources.add-mappings=true -jar /app/app.jar"]
