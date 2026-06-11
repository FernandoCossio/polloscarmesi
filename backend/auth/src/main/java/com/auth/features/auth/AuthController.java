package com.auth.features.auth;

import com.auth.common.response.ApiResponse;
import com.auth.domain.dtos.auth.LoginRequest;
import com.auth.domain.dtos.auth.TokenResponse;
import com.auth.domain.dtos.usuario.RegistrarClienteDto;
import com.auth.domain.dtos.usuario.ResponseUsuarioDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.auth.features.usuario.UsuarioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final AuthService authService;
	private final UsuarioService usuarioService;

	public AuthController(AuthService authService, UsuarioService usuarioService) {
		this.authService = authService;
		this.usuarioService = usuarioService;
	}

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<TokenResponse>> login(
		@Valid @RequestBody LoginRequest request
	) {
		TokenResponse result = authService.login(request);
		return ResponseEntity.ok(ApiResponse.success(result, "Inicio de sesión exitoso."));
	}

	@PostMapping("/register")
	public ResponseEntity<ApiResponse<ResponseUsuarioDto>> register(@Valid @RequestBody RegistrarClienteDto request) {
		ResponseUsuarioDto created = authService.register(request);
		return ResponseEntity.status(HttpStatus.CREATED)
			.body(ApiResponse.success(created, "Cliente registrado correctamente."));
	}

	@GetMapping("/usuarios/{id}")
	public ResponseEntity<ApiResponse<ResponseUsuarioDto>> obtenerUsuarioPorId(@PathVariable Long id) {
		ResponseUsuarioDto result = usuarioService.obtenerUsuarioPorId(id);
		return ResponseEntity.ok(ApiResponse.success(result, "Usuario recuperado correctamente."));
	}
}
