package com.auth.features.usuario;

import com.auth.domain.models.Usuario;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.auth.domain.enums.RolNombre;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	@EntityGraph(attributePaths = "roles")
	Optional<Usuario> findByUsernameIgnoreCase(String username);

	@EntityGraph(attributePaths = "roles")
	Optional<Usuario> findByEmailIgnoreCase(String email);

	@EntityGraph(attributePaths = "roles")
	Optional<Usuario> findByUuid(UUID uuid);

	@EntityGraph(attributePaths = "roles")
	List<Usuario> findAllByRoles_NombreIn(Set<RolNombre> roles);
}
