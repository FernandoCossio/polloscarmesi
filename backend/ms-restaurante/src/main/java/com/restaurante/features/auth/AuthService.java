package com.restaurante.features.auth;


import com.restaurante.auth.jwt.JwtService;
import com.restaurante.domain.dtos.auth.LoginRequest;
import com.restaurante.domain.dtos.auth.TokenResponse;
import com.restaurante.domain.dtos.usuario.RegistrarClienteDto;
import com.restaurante.domain.dtos.usuario.ResponseUsuarioDto;
import com.restaurante.features.auth.exceptions.CredencialesInvalidasException;
import com.restaurante.features.usuario.UsuarioService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;
	private final UsuarioService usuarioService;

	public AuthService(
		AuthenticationManager authenticationManager,
		JwtService jwtService,
		UsuarioService usuarioService
	) {
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
		this.usuarioService = usuarioService;
	}

	public TokenResponse login(LoginRequest request) {
		try {
			Authentication authentication = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.username(), request.password())
			);

			String accessToken = jwtService.generateAccessToken(authentication);
			return new TokenResponse(accessToken);
		} catch (AuthenticationException ex) {
			throw new CredencialesInvalidasException();
		}
	}

	public ResponseUsuarioDto register(RegistrarClienteDto request) {
		return usuarioService.registrarCliente(request);
	}
}
