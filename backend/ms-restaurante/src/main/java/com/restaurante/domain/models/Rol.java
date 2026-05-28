package com.restaurante.domain.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import com.restaurante.domain.enums.RolNombre;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "rol")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("is_deleted = false")
public class Rol extends BaseEntity{

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	@Enumerated(EnumType.STRING)
	private RolNombre nombre;

	@Column(nullable = false)
	private String descripcion;

	@ManyToMany(mappedBy = "roles")
	private Set<Usuario> usuarios = new HashSet<>();

}
