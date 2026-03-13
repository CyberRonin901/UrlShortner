FROM eclipse-temurin:25
RUN mkdir /app
COPY /target/UrlShortner.jar /app
CMD ["java", "-jar", "/app/UrlShortner.jar"]