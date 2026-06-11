package com.auth.features.auth;


import com.auth.auth.jwt.JwtService;
import com.auth.domain.dtos.auth.LoginRequest;
import com.auth.domain.dtos.auth.ServiceTokenRequest;
import com.auth.domain.dtos.auth.TokenResponse;
import com.auth.domain.dtos.usuario.RegistrarClienteDto;
import com.auth.domain.dtos.usuario.ResponseUsuarioDto;
import com.auth.features.auth.exceptions.CredencialesInvalidasException;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import com.auth.features.usuario.UsuarioService;
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
	private final Map<String, String> serviceClients;

	public AuthService(
		AuthenticationManager authenticationManager,
		JwtService jwtService,
		UsuarioService usuarioService,
		@Value("${app.service-auth.clients:}") String rawServiceClients
	) {
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
		this.usuarioService = usuarioService;
		this.serviceClients = parseServiceClients(rawServiceClients);
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

	public TokenResponse issueServiceToken(ServiceTokenRequest request) {
		if (serviceClients.isEmpty()) {
			throw new IllegalStateException(
				"No hay clientes tecnicos configurados en app.service-auth.clients"
			);
		}

		String configuredSecret = serviceClients.get(request.clientId());
		if (configuredSecret == null || !configuredSecret.equals(request.clientSecret())) {
			throw new CredencialesInvalidasException();
		}

		String accessToken = jwtService.generateServiceToken(request.clientId());
		return new TokenResponse(accessToken);
	}

	private Map<String, String> parseServiceClients(String rawServiceClients) {
		if (rawServiceClients == null || rawServiceClients.isBlank()) {
			return Map.of();
		}

		return Arrays.stream(rawServiceClients.split(","))
			.map(String::trim)
			.filter(entry -> !entry.isBlank())
			.map(entry -> entry.split("=", 2))
			.filter(parts -> parts.length == 2)
			.map(parts -> Map.entry(parts[0].trim(), parts[1].trim()))
			.filter(entry -> !entry.getKey().isBlank() && !entry.getValue().isBlank())
			.collect(Collectors.toUnmodifiableMap(Map.Entry::getKey, Map.Entry::getValue, (left, _right) -> left));
	}
}
