package com.auth.auth.jwt;

import com.auth.auth.userdetails.UsuarioPrincipal;
import com.auth.config.JwtConfig.JwtSettings;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
	private final JwtEncoder jwtEncoder;
	private final JwtSettings jwtSettings;

	public JwtService(JwtEncoder jwtEncoder, JwtSettings jwtSettings) {
		this.jwtEncoder = jwtEncoder;
		this.jwtSettings = jwtSettings;
	}

	public String generateAccessToken(Authentication authentication) {
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof UsuarioPrincipal usuarioPrincipal)) {
			throw new IllegalStateException("Principal no soportado para generación de JWT");
		}

		Instant now = Instant.now();
		Instant expiresAt = now.plus(jwtSettings.accessTokenTtl());

        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).filter(Objects::nonNull)
                .filter(authority -> authority.startsWith("ROLE_"))
                .toList();

		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer(jwtSettings.issuer())
			.issuedAt(now)
			.expiresAt(expiresAt)
			.subject(usuarioPrincipal.getUsername())
			.claim("roles", roles)
			.claim("uid", usuarioPrincipal.getId())
			.build();

		return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
	}
}
