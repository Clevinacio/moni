package com.moni.dto;

public record LoginResponse(String token, String type, String userId) {
}