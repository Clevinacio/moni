package com.moni.mapper;

import java.util.List;

import com.moni.dto.TransacaoResponse;
import com.moni.entity.Transacao;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransacaoMapper {

    @Mapping(target = "id", expression = "java(transacao.getId() != null ? transacao.getId().toString() : null)")
    @Mapping(target = "categoria", source = "categoria.nome")
    TransacaoResponse paraResponse(Transacao transacao);

    List<TransacaoResponse> paraResponses(List<Transacao> transacoes);
}
