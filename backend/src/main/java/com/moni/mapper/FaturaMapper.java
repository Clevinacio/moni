package com.moni.mapper;

import com.moni.dto.CriarFaturaRequest;
import com.moni.dto.FaturaResponse;
import com.moni.entity.Fatura;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FaturaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "criadaEm", ignore = true)
    @Mapping(target = "atualizadaEm", ignore = true)
    @Mapping(target = "paga", constant = "false")
    Fatura paraEntidade(CriarFaturaRequest requisicao);

    FaturaResponse paraResposta(Fatura fatura);
}
