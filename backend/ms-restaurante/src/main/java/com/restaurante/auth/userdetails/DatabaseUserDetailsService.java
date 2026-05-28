package com.restaurante.auth.userdetails;

import com.restaurante.domain.models.Usuario;
import com.restaurante.features.usuario.UsuarioRepository;
import com.restaurante.features.usuario.exceptions.UsuarioNoEncontradoException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {

	private final UsuarioRepository usuarioRepository;

	public DatabaseUserDetailsService(UsuarioRepository usuarioRepository) {
		this.usuarioRepository = usuarioRepository;
	}

	@Override
	public UserDetails loadUserByUsername(String usernameOrEmail) {
		Usuario usuario = usuarioRepository.findByUsernameIgnoreCase(usernameOrEmail)
				.or(() -> usuarioRepository.findByEmailIgnoreCase(usernameOrEmail))
				.orElseThrow(UsuarioNoEncontradoException::new);

		return UsuarioPrincipal.from(usuario);
	}
}
