package com.moni.mapper;

import java.util.List;

import com.moni.dto.MetaResponse;
import com.moni.entity.Meta;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MetaMapper {

    @Mapping(target = "id", expression = "java(meta.getId() != null ? meta.getId().toString() : null)")
    MetaResponse paraResponse(Meta meta);

    List<MetaResponse> paraResponses(List<Meta> metas);
}
