package com.moni.configuration;

public record ErroApiResponse(String timestamp, int status, String erro, String mensagem) {
}