package com.restaurante.seed;

import com.restaurante.domain.models.Categoria;
import com.restaurante.domain.models.Producto;
import com.restaurante.features.categoria.CategoriaRepository;
import com.restaurante.features.productos.ProductoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
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
        Categoria pollos = upsertCategoria("Pollos", "Deliciosos pollos a la brasa con el sabor único de la casa", "lunch_dining");
        Categoria combos = upsertCategoria("Combos", "Combos para compartir con gaseosa o guarnición", "restaurant_menu");
        Categoria bebidas = upsertCategoria("Bebidas", "Bebidas y refrescos para acompañar tu comida", "emoji_food_beverage");
        Categoria guarniciones = upsertCategoria("Guarniciones", "Acompañamientos perfectos para tu pollo", "restaurant");
        Categoria postres = upsertCategoria("Postres", "Dulces para cerrar con broche de oro", "icecream");

        List<ProductoSeed> seeds = new ArrayList<>();
        seeds.add(new ProductoSeed("1/4 de Pollo a la Brasa", "Clásico pollo a la brasa con papas y ensalada", new BigDecimal("22.50"), pollos));
        seeds.add(new ProductoSeed("1/2 Pollo a la Brasa", "Medio pollo con papas, ensalada y cremas de la casa", new BigDecimal("39.90"), pollos));
        seeds.add(new ProductoSeed("Pollo Entero a la Brasa", "Pollo entero jugoso, acompañado de papas fritas y cremas de la casa", new BigDecimal("78.00"), pollos));
        seeds.add(new ProductoSeed("Broaster (2 piezas)", "Pollo broaster crocante con papas y ensalada", new BigDecimal("19.90"), pollos));
        seeds.add(new ProductoSeed("Alitas BBQ (8 unidades)", "Alitas bañadas en salsa BBQ con porción de papas", new BigDecimal("24.90"), pollos));

        seeds.add(new ProductoSeed("Combo Familiar (Pollo entero + gaseosa 1.5L)", "Ideal para 4 personas", new BigDecimal("89.90"), combos));
        seeds.add(new ProductoSeed("Combo Pareja (1/2 pollo + 2 bebidas)", "Perfecto para compartir", new BigDecimal("49.90"), combos));
        seeds.add(new ProductoSeed("Combo Ejecutivo (1/4 pollo + bebida)", "Rápido y contundente", new BigDecimal("28.90"), combos));
        seeds.add(new ProductoSeed("Combo Broaster (2 piezas + bebida)", "Crocante y sabroso", new BigDecimal("24.90"), combos));

        seeds.add(new ProductoSeed("Chicha Morada 1L", "Refrescante chicha morada natural de maíz morado", new BigDecimal("12.00"), bebidas));
        seeds.add(new ProductoSeed("Limonada 1L", "Limonada natural con hierbabuena", new BigDecimal("12.00"), bebidas));
        seeds.add(new ProductoSeed("Gaseosa Inka Kola 1.5L", "Gaseosa helada en botella no retornable", new BigDecimal("9.50"), bebidas));
        seeds.add(new ProductoSeed("Gaseosa Coca Cola 1.5L", "Gaseosa helada en botella no retornable", new BigDecimal("9.50"), bebidas));
        seeds.add(new ProductoSeed("Agua Sin Gas 500ml", "Agua mineral sin gas", new BigDecimal("3.50"), bebidas));

        seeds.add(new ProductoSeed("Papas Fritas Familiares", "Porción de papas fritas crujientes doradas", new BigDecimal("15.00"), guarniciones));
        seeds.add(new ProductoSeed("Papas Fritas Personales", "Porción personal de papas fritas", new BigDecimal("7.50"), guarniciones));
        seeds.add(new ProductoSeed("Ensalada Criolla", "Cebolla, tomate y limón", new BigDecimal("6.00"), guarniciones));
        seeds.add(new ProductoSeed("Arroz Chaufa", "Chaufa al estilo casero", new BigDecimal("12.90"), guarniciones));
        seeds.add(new ProductoSeed("Tequeños (6 unidades)", "Tequeños con salsa de la casa", new BigDecimal("14.90"), guarniciones));

        seeds.add(new ProductoSeed("Mazamorra Morada", "Postre tradicional peruano", new BigDecimal("7.00"), postres));
        seeds.add(new ProductoSeed("Arroz con Leche", "Arroz con leche cremoso con canela", new BigDecimal("7.00"), postres));
        seeds.add(new ProductoSeed("Suspiro Limeño", "Clásico suspiro limeño", new BigDecimal("9.90"), postres));

        int created = 0;
        for (ProductoSeed seed : seeds) {
            if (!productoRepository.existsByNombre(seed.nombre())) {
                Producto producto = new Producto();
                producto.setNombre(seed.nombre());
                producto.setDescripcion(seed.descripcion());
                producto.setPrecio(seed.precio());
                producto.setCategoria(seed.categoria());
                producto.setDisponible(true);
                productoRepository.save(producto);
                created++;
            }
        }

        long total = productoRepository.count();
        if (created > 0) {
            System.out.println("Seeder: Productos creados: " + created + ". Total productos en BD: " + total);
        }
    }

    private Categoria upsertCategoria(String nombre, String descripcion, String icon) {
        return categoriaRepository.findByNombre(nombre).orElseGet(() -> {
            Categoria categoria = new Categoria();
            categoria.setNombre(nombre);
            categoria.setDescripcion(descripcion);
            categoria.setIcon(icon);
            return categoriaRepository.save(categoria);
        });
    }

    private record ProductoSeed(String nombre, String descripcion, BigDecimal precio, Categoria categoria) {
    }
}
