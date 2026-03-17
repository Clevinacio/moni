package com.moni.mapper;

import com.moni.dto.CadastroResponse;
import com.moni.dto.LoginResponse;
import com.moni.entity.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AutenticacaoMapper {

	@Mapping(target = "id", expression = "java(usuario.getId() != null ? usuario.getId().toString() : null)")
	@Mapping(target = "name", source = "usuario.nome")
	CadastroResponse paraCadastroResponse(Usuario usuario, String token);

	@Mapping(target = "type", constant = "Bearer")
	@Mapping(target = "userId", expression = "java(usuario.getId() != null ? usuario.getId().toString() : null)")
	LoginResponse paraLoginResponse(Usuario usuario, String token);
}