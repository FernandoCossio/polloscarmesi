package com.restaurante.seed;

import com.restaurante.domain.models.Categoria;
import com.restaurante.domain.models.Producto;
import com.restaurante.features.categoria.CategoriaRepository;
import com.restaurante.features.productos.ProductoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@Order(1)
public class MenuSeeder implements CommandLineRunner {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    public MenuSeeder(CategoriaRepository categoriaRepository, ProductoRepository productoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (categoriaRepository.count() == 0) {
            // Seeding Categoria
            Categoria pollos = new Categoria();
            pollos.setNombre("Pollos");
            pollos.setDescripcion("Deliciosos pollos a la brasa con el sabor único de la casa");
            pollos.setIcon("lunch_dining");
            pollos = categoriaRepository.save(pollos);

            Categoria bebidas = new Categoria();
            bebidas.setNombre("Bebidas");
            bebidas.setDescripcion("Bebidas y refrescos para acompañar tu comida");
            bebidas.setIcon("emoji_food_beverage");
            bebidas = categoriaRepository.save(bebidas);

            Categoria guarniciones = new Categoria();
            guarniciones.setNombre("Guarniciones");
            guarniciones.setDescripcion("Acompañamientos perfectos para tu pollo");
            guarniciones.setIcon("restaurant");
            guarniciones = categoriaRepository.save(guarniciones);

            // Seeding Productos
            Producto pollo1 = new Producto();
            pollo1.setNombre("1/4 de Pollo a la Brasa");
            pollo1.setDescripcion("Clásico pollo a la brasa con papas y ensalada");
            pollo1.setPrecio(new BigDecimal("22.50"));
            pollo1.setCategoria(pollos);
            pollo1.setDisponible(true);
            productoRepository.save(pollo1);

            Producto pollo2 = new Producto();
            pollo2.setNombre("Pollo Entero a la Brasa");
            pollo2.setDescripcion("Pollo entero jugoso, acompañado de papas fritas y cremas de la casa");
            pollo2.setPrecio(new BigDecimal("78.00"));
            pollo2.setCategoria(pollos);
            pollo2.setDisponible(true);
            productoRepository.save(pollo2);

            Producto bebida1 = new Producto();
            bebida1.setNombre("Chicha Morada 1L");
            bebida1.setDescripcion("Refrescante chicha morada natural de maíz morado");
            bebida1.setPrecio(new BigDecimal("12.00"));
            bebida1.setCategoria(bebidas);
            bebida1.setDisponible(true);
            productoRepository.save(bebida1);

            Producto bebida2 = new Producto();
            bebida2.setNombre("Gaseosa Inka Kola 1.5L");
            bebida2.setDescripcion("Gaseosa helada en botella no retornable");
            bebida2.setPrecio(new BigDecimal("9.50"));
            bebida2.setCategoria(bebidas);
            bebida2.setDisponible(true);
            productoRepository.save(bebida2);

            Producto guarnicion1 = new Producto();
            guarnicion1.setNombre("Papas Fritas Familiares");
            guarnicion1.setDescripcion("Poción de papas fritas crujientes doradas");
            guarnicion1.setPrecio(new BigDecimal("15.00"));
            guarnicion1.setCategoria(guarniciones);
            guarnicion1.setDisponible(true);
            productoRepository.save(guarnicion1);

            System.out.println("Seeder: Menú inicial y productos cargados exitosamente.");
        }
    }
}
