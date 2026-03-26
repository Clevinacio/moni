package com.moni.configuration;

import java.security.Principal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration(proxyBeanMethods = false)
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final String PREFIXO_BEARER = "Bearer ";

    private final JwtService jwtService;

    @Value("${moni.cors.allowed-origins}")
    private String origensPermitidas;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/notificacoes")
                .setAllowedOriginPatterns(listarOrigensPermitidas().toArray(String[]::new));
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
                    return message;
                }

                String autorizacao = extrairCabecalhoAutorizacao(accessor);
                if (autorizacao == null || !autorizacao.startsWith(PREFIXO_BEARER)) {
                    throw new JwtException("Token nao informado.");
                }

                String token = autorizacao.substring(PREFIXO_BEARER.length());
                UUID usuarioId = jwtService.extrairUsuarioId(token);
                Principal principal = UsernamePasswordAuthenticationToken.authenticated(
                        usuarioId.toString(),
                        null,
                        Collections.emptyList());

                accessor.setUser(principal);
                return message;
            }
        });
    }

    private List<String> listarOrigensPermitidas() {
        return Arrays.stream(origensPermitidas.split(","))
                .map(String::trim)
                .filter((origem) -> !origem.isBlank())
                .toList();
    }

    private String extrairCabecalhoAutorizacao(StompHeaderAccessor accessor) {
        List<String> valores = accessor.getNativeHeader("Authorization");

        if (valores == null || valores.isEmpty()) {
            return null;
        }

        return valores.getFirst();
    }
}
