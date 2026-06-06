package com.restaurante.config;

import graphql.schema.Coercing;
import graphql.schema.CoercingParseLiteralException;
import graphql.schema.CoercingParseValueException;
import graphql.schema.CoercingSerializeException;
import graphql.schema.GraphQLScalarType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;
import org.springframework.web.multipart.MultipartFile;

@Configuration
public class GraphQlConfig {

    @Bean
    public RuntimeWiringConfigurer runtimeWiringConfigurer() {
        GraphQLScalarType uploadScalar = GraphQLScalarType.newScalar()
                .name("Upload")
                .description("A file multipart upload representation")
                .coercing(new Coercing<MultipartFile, Void>() {
                    @Override
                    public Void serialize(Object dataFetcherResult) throws CoercingSerializeException {
                        throw new CoercingSerializeException("Upload scalar can only be used as input");
                    }

                    @Override
                    public MultipartFile parseValue(Object input) throws CoercingParseValueException {
                        if (input instanceof MultipartFile) {
                            return (MultipartFile) input;
                        } else if (input == null) {
                            return null;
                        }
                        throw new CoercingParseValueException("Expected a MultipartFile object, but got: " + input.getClass().getName());
                    }

                    @Override
                    public MultipartFile parseLiteral(Object input) throws CoercingParseLiteralException {
                        throw new CoercingParseLiteralException("Upload scalar can only be parsed from variables");
                    }
                })
                .build();

        return wiringBuilder -> wiringBuilder.scalar(uploadScalar);
    }
}
