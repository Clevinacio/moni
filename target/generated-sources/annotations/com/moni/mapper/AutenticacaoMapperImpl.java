package com.moni.mapper;

import com.moni.dto.CadastroResponse;
import com.moni.dto.LoginResponse;
import com.moni.entity.Usuario;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-03-16T22:17:05-0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.1 (Oracle Corporation)"
)
@Component
public class AutenticacaoMapperImpl implements AutenticacaoMapper {

    @Override
    public CadastroResponse paraCadastroResponse(Usuario usuario, String token) {
        if ( usuario == null && token == null ) {
            return null;
        }

        String name = null;
        String email = null;
        if ( usuario != null ) {
            name = usuario.getNome();
            email = usuario.getEmail();
        }
        String token1 = null;
        token1 = token;

        String id = usuario.getId() != null ? usuario.getId().toString() : null;

        CadastroResponse cadastroResponse = new CadastroResponse( id, name, email, token1 );

        return cadastroResponse;
    }

    @Override
    public LoginResponse paraLoginResponse(Usuario usuario, String token) {
        if ( usuario == null && token == null ) {
            return null;
        }

        String token1 = null;
        token1 = token;

        String type = "Bearer";
        String userId = usuario.getId() != null ? usuario.getId().toString() : null;

        LoginResponse loginResponse = new LoginResponse( token1, type, userId );

        return loginResponse;
    }
}
