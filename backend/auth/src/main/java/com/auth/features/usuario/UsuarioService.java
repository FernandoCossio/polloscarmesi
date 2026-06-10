package com.auth.features.usuario;

import com.auth.domain.dtos.usuario.AdminActualizarUsuarioDto;
import com.auth.domain.dtos.usuario.AdminCrearUsuarioDto;
import com.auth.domain.dtos.usuario.AdminUsuarioResponseDto;
import com.auth.domain.dtos.usuario.RegistrarClienteDto;
import com.auth.domain.dtos.usuario.ResponseUsuarioDto;
import com.auth.domain.enums.RolNombre;
import com.auth.domain.models.Rol;
import com.auth.domain.models.Usuario;
import com.auth.features.rol.RolRepository;
import com.auth.features.rol.exceptions.RolNoEncontradoException;
import com.auth.features.usuario.exceptions.UsuarioDuplicadoException;
import com.auth.features.usuario.exceptions.UsuarioNoEncontradoException;
import com.auth.features.usuario.exceptions.UsuarioRolNoPermitidoException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Set<RolNombre> ROLES_PERSONAL = Set.of(
            RolNombre.REPARTIDOR,
            RolNombre.CAJERO,
            RolNombre.COCINA
    );

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

    @Transactional(readOnly = true)
    public List<AdminUsuarioResponseDto> listarPersonal(RolNombre rol) {
        if (rol != null && !ROLES_PERSONAL.contains(rol)) {
            throw new UsuarioRolNoPermitidoException();
        }

        Set<RolNombre> roles = rol != null ? Set.of(rol) : ROLES_PERSONAL;
        return usuarioRepository.findAllByRoles_NombreIn(roles).stream()
                .map(this::mapToAdminDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminUsuarioResponseDto obtenerPorUuid(UUID uuid) {
        Usuario usuario = usuarioRepository.findByUuid(uuid)
                .orElseThrow(UsuarioNoEncontradoException::new);
        return mapToAdminDto(usuario);
    }

    @Transactional
    public AdminUsuarioResponseDto crearPersonal(AdminCrearUsuarioDto dto) {
        if (!ROLES_PERSONAL.contains(dto.rol())) {
            throw new UsuarioRolNoPermitidoException();
        }

        if (usuarioRepository.findByUsernameIgnoreCase(dto.username()).isPresent()) {
            throw new UsuarioDuplicadoException();
        }
        if (usuarioRepository.findByEmailIgnoreCase(dto.email()).isPresent()) {
            throw new UsuarioDuplicadoException();
        }

        Rol rol = rolRepository.findByNombre(dto.rol())
                .orElseThrow(RolNoEncontradoException::new);

        Usuario usuario = new Usuario();
        usuario.setUsername(dto.username());
        usuario.setEmail(dto.email());
        usuario.setNombreCompleto(dto.nombreCompleto());
        usuario.setPassword(passwordEncoder.encode(dto.password()));
        usuario.setTelefono(dto.telefono());
        usuario.setActivo(dto.activo() != null ? dto.activo() : true);
        usuario.setRoles(Set.of(rol));

        return mapToAdminDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public AdminUsuarioResponseDto actualizarPersonal(UUID uuid, AdminActualizarUsuarioDto dto) {
        Usuario usuario = usuarioRepository.findByUuid(uuid)
                .orElseThrow(UsuarioNoEncontradoException::new);

        boolean esPersonal = usuario.getRoles().stream()
                .anyMatch(r -> r.getNombre() != null && ROLES_PERSONAL.contains(r.getNombre()));
        if (!esPersonal) {
            throw new UsuarioRolNoPermitidoException();
        }

        if (dto.email() != null && !dto.email().isBlank() && !dto.email().equalsIgnoreCase(usuario.getEmail())) {
            usuarioRepository.findByEmailIgnoreCase(dto.email())
                    .filter(u -> !u.getUuid().equals(usuario.getUuid()))
                    .ifPresent(u -> {
                        throw new UsuarioDuplicadoException();
                    });
            usuario.setEmail(dto.email());
        }

        if (dto.nombreCompleto() != null && !dto.nombreCompleto().isBlank()) {
            usuario.setNombreCompleto(dto.nombreCompleto());
        }

        if (dto.telefono() != null) {
            usuario.setTelefono(dto.telefono());
        }

        if (dto.password() != null && !dto.password().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(dto.password()));
        }

        if (dto.rol() != null) {
            if (!ROLES_PERSONAL.contains(dto.rol())) {
                throw new UsuarioRolNoPermitidoException();
            }
            Rol rol = rolRepository.findByNombre(dto.rol())
                    .orElseThrow(RolNoEncontradoException::new);
            usuario.setRoles(Set.of(rol));
        }

        return mapToAdminDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public AdminUsuarioResponseDto cambiarEstado(UUID uuid, boolean activo) {
        Usuario usuario = usuarioRepository.findByUuid(uuid)
                .orElseThrow(UsuarioNoEncontradoException::new);

        boolean esPersonal = usuario.getRoles().stream()
                .anyMatch(r -> r.getNombre() != null && ROLES_PERSONAL.contains(r.getNombre()));
        if (!esPersonal) {
            throw new UsuarioRolNoPermitidoException();
        }

        usuario.setActivo(activo);
        return mapToAdminDto(usuarioRepository.save(usuario));
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

    private AdminUsuarioResponseDto mapToAdminDto(Usuario usuario) {
        return new AdminUsuarioResponseDto(
                usuario.getUuid(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getNombreCompleto(),
                usuario.getTelefono(),
                usuario.getActivo(),
                usuario.getRoles().stream().map(Rol::getNombre).map(Enum::name).collect(Collectors.toSet())
        );
    }
}
