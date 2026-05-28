package com.restaurante.features.usuario;

import com.restaurante.domain.dtos.usuario.RegistrarClienteDto;
import com.restaurante.domain.dtos.usuario.ResponseUsuarioDto;
import com.restaurante.domain.enums.RolNombre;
import com.restaurante.domain.models.Rol;
import com.restaurante.domain.models.Usuario;
import com.restaurante.features.rol.RolRepository;
import com.restaurante.features.rol.exceptions.RolNoEncontradoException;
import com.restaurante.features.usuario.exceptions.UsuarioDuplicadoException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public ResponseUsuarioDto registrarCliente(RegistrarClienteDto dto) {
        if (usuarioRepository.findByUsernameIgnoreCase(dto.username()).isPresent()) {
            throw new UsuarioDuplicadoException();
        }
        if (usuarioRepository.findByEmailIgnoreCase(dto.email()).isPresent()) {
            throw new UsuarioDuplicadoException();
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(dto.username());
        usuario.setEmail(dto.email());
        usuario.setNombreCompleto(dto.nombreCompleto());
        usuario.setPassword(passwordEncoder.encode(dto.password()));
        usuario.setTelefono(dto.telefono());
        usuario.setActivo(false);

        Rol rolCliente = rolRepository.findByNombre(RolNombre.CLIENTE)
                .orElseThrow(RolNoEncontradoException::new);
        
        usuario.setRoles(Set.of(rolCliente));

        Usuario guardado = usuarioRepository.save(usuario);

        return mapToDto(guardado);
    }

    private ResponseUsuarioDto mapToDto(Usuario usuario) {
        return new ResponseUsuarioDto(
                usuario.getUuid(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getNombreCompleto(),
                usuario.getTelefono(),
                usuario.getRoles().stream().map(Rol::getNombre).map(Enum::name).collect(Collectors.toSet())
        );
    }
}
