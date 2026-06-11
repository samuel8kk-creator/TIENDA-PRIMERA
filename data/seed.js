/* ================================================
   Away — Seed Data
   Initial products, categories, and sample reviews
   ================================================ */

const SEED_DATA = {
    categories: [
        { id: 'mujer', name: 'Mujer', emoji: '👗', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&h=200&fit=crop', isPermanent: true, isActive: true },
        { id: 'hombre', name: 'Hombre', emoji: '👔', image: 'https://images.unsplash.com/photo-1490243248048-826c07b5583b?w=200&h=200&fit=crop', isPermanent: true, isActive: true },
        { id: 'nino', name: 'Niño', emoji: '🧒', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=200&h=200&fit=crop', isPermanent: true, isActive: true },
        { id: 'descuentos', name: 'Descuentos', emoji: '🏷️', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200&h=200&fit=crop', isPermanent: true, isActive: true },
        { id: 'san-valentin', name: 'San Valentín', emoji: '💝', image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=200&h=200&fit=crop', isPermanent: false, isActive: true },
        { id: 'dia-mujer', name: 'Día de la Mujer', emoji: '🌸', image: 'https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?w=200&h=200&fit=crop', isPermanent: false, isActive: false },
        { id: 'dia-hombre', name: 'Día del Hombre', emoji: '🎩', image: 'https://images.unsplash.com/photo-1550246140-5119ae4790b8?w=200&h=200&fit=crop', isPermanent: false, isActive: false },
        { id: 'dia-madres', name: 'Día de las Madres', emoji: '💐', image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200&h=200&fit=crop', isPermanent: false, isActive: false },
        { id: 'dia-padres', name: 'Día del Padre', emoji: '👨‍👧', image: 'https://images.unsplash.com/photo-1555196301-9acc011dfdf4?w=200&h=200&fit=crop', isPermanent: false, isActive: false },
    ],

    products: [
        {
            id: 'p001',
            name: 'Vestido Floral Elegante',
            description: 'Vestido de corte A con estampado floral en tonos pastel, perfecto para cualquier ocasión. Tela suave y cómoda con caída impecable.',
            price: 2800,
            oldPrice: null,
            category: 'mujer',
            image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop'],
            badge: 'Nuevo',
            sizeVariants: [
                { size: 'S', colors: ['Azul', 'Rojo'] },
                { size: 'M', colors: ['Rojo', 'Naranja'] },
                { size: 'L', colors: ['Rojo'] }
            ],
            reviews: [
                { name: 'María G.', rating: 5, text: '¡Hermoso vestido! La tela es de excelente calidad.', date: '2026-01-20' },
                { name: 'Ana P.', rating: 4, text: 'Bonito diseño, talla exacta.', date: '2026-01-25' }
            ]
        },
        {
            id: 'p002',
            name: 'Blusa Satinada Rosa',
            description: 'Blusa de satén con cuello en V y mangas abullonadas. Ideal para combinar con jeans o faldas.',
            price: 1500,
            oldPrice: null,
            category: 'mujer',
            image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=500&h=600&fit=crop'],
            badge: null,
            stock: 10,
            colors: ['#FFC0CB', '#FFFFFF'],
            reviews: [
                { name: 'Laura M.', rating: 5, text: 'Me encantó, la usé para una cena romántica y quedó perfecta.', date: '2026-02-01' }
            ]
        },
        {
            id: 'p003',
            name: 'Falda Plisada Midi',
            description: 'Falda plisada de largo midi con cintura elástica. Elegante y versátil para el día a día.',
            price: 1800,
            oldPrice: 2200,
            category: 'mujer',
            image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop'],
            badge: '-18%',
            badgeType: 'discount',
            stock: 25,
            colors: ['#000000', '#2F4F4F', '#800000'],
            reviews: []
        },
        {
            id: 'p004',
            name: 'Camisa Lino Premium',
            description: 'Camisa de lino 100% natural, corte regular con botones de coco. Fresca y elegante para el clima tropical.',
            price: 2200,
            oldPrice: null,
            category: 'hombre',
            image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=600&fit=crop'],
            badge: 'Popular',
            stock: 12,
            colors: ['#FFFFFF', '#F5F5DC', '#ADD8E6'],
            reviews: [
                { name: 'Carlos R.', rating: 5, text: 'Excelente calidad del lino. Muy fresca.', date: '2026-01-15' },
                { name: 'José M.', rating: 4, text: 'Buena camisa, la uso para el trabajo.', date: '2026-01-28' }
            ]
        },
        {
            id: 'p005',
            name: 'Pantalón Chino Slim',
            description: 'Pantalón chino de corte slim fit en algodón stretch. Cómodo y con estilo para cualquier ocasión.',
            price: 1900,
            oldPrice: null,
            category: 'hombre',
            image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=600&fit=crop'],
            badge: null,
            stock: 18,
            colors: ['#000080', '#556B2F', '#A52A2A'],
            reviews: []
        },
        {
            id: 'p006',
            name: 'Polo Clásico Verde',
            description: 'Polo de algodón piqué con cuello y puños acanalados. Color verde menta, ideal para un look casual.',
            price: 1200,
            oldPrice: 1600,
            category: 'hombre',
            image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&h=600&fit=crop'],
            badge: '-25%',
            badgeType: 'discount',
            stock: 30,
            colors: ['#3EB489', '#FFFFFF', '#000000'],
            reviews: [
                { name: 'Pedro L.', rating: 5, text: 'Color precioso, muy cómoda.', date: '2026-02-03' }
            ]
        },
        {
            id: 'p007',
            name: 'Conjunto Infantil Deportivo',
            description: 'Conjunto de dos piezas para niños: camiseta estampada y pantalón jogger. Material suave y resistente.',
            price: 1400,
            oldPrice: null,
            category: 'nino',
            image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&h=600&fit=crop'],
            badge: 'Nuevo',
            stock: 40,
            colors: ['#87CEEB', '#FFD700'],
            reviews: [
                { name: 'Patricia R.', rating: 5, text: 'A mi hijo le encanta, muy cómodo para jugar.', date: '2026-02-05' }
            ]
        },
        {
            id: 'p008',
            name: 'Vestido Niña Princesa',
            description: 'Vestido de tul con forro de algodón, perfecto para fiestas y eventos especiales. Disponible en rosa y lila.',
            price: 1800,
            oldPrice: null,
            category: 'nino',
            image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500&h=600&fit=crop'],
            badge: null,
            stock: 15,
            colors: ['#FFB6C1', '#DDA0DD'],
            reviews: []
        },
        {
            id: 'p009',
            name: 'Camiseta Niño Dinosaurio',
            description: 'Camiseta de algodón 100% con estampado de dinosaurio. Suave, duradera y perfecta para el día a día.',
            price: 600,
            oldPrice: 900,
            category: 'nino',
            image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&h=600&fit=crop'],
            badge: '-33%',
            badgeType: 'discount',
            stock: 50,
            colors: ['#FFFFFF', '#808080'],
            reviews: []
        },
        {
            id: 'p010',
            name: 'Set de Aretes Corazón',
            description: 'Set de 3 pares de aretes en forma de corazón con acabado dorado. El regalo perfecto para San Valentín.',
            price: 800,
            oldPrice: null,
            category: 'san-valentin',
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=600&fit=crop'],
            badge: '💝 Valentín',
            stock: 100,
            colors: ['#FFD700', '#C0C0C0', '#E5E4E2'],
            reviews: [
                { name: 'Rosa D.', rating: 5, text: '¡Hermosos! Los compré para mi hija y le fascinaron.', date: '2026-02-10' }
            ]
        },
        {
            id: 'p011',
            name: 'Bolso Bandolera Elegante',
            description: 'Bolso de cuero sintético con correa ajustable. Diseño compacto pero espacioso, perfecto para salir.',
            price: 2500,
            oldPrice: 3200,
            category: 'descuentos',
            image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=600&fit=crop'],
            badge: '-22%',
            badgeType: 'discount',
            stock: 20,
            colors: ['#000000', '#8B4513', '#D2B48C'],
            reviews: [
                { name: 'Carmen S.', rating: 4, text: 'Bonito bolso, buena calidad por el precio.', date: '2026-01-30' }
            ]
        },
        {
            id: 'p012',
            name: 'Reloj Minimalista Dorado',
            description: 'Reloj analógico con caja dorada y correa de malla. Diseño minimalista y elegante, resistente al agua.',
            price: 3500,
            oldPrice: 4500,
            category: 'descuentos',
            image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&h=600&fit=crop'],
            badge: '-22%',
            badgeType: 'discount',
            stock: 15,
            colors: ['#FFD700', '#C0C0C0'],
            reviews: [
                { name: 'Elena V.', rating: 5, text: 'Precioso reloj, se ve mucho más caro de lo que es.', date: '2026-02-08' },
                { name: 'Miguel A.', rating: 5, text: 'Lo compré como regalo y quedaron encantados.', date: '2026-02-12' }
            ]
        },
        {
            id: 'p013',
            name: 'Perfume Floral Romántico',
            description: 'Eau de parfum con notas de rosa, jazmín y vainilla. Fragancia dulce y duradera, ideal para regalar.',
            price: 2200,
            oldPrice: null,
            category: 'san-valentin',
            image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=600&fit=crop'],
            badge: '💝 Valentín',
            stock: 30,
            colors: [],
            reviews: []
        },
        {
            id: 'p014',
            name: 'Sneakers Urbanos Blancos',
            description: 'Zapatillas deportivas de diseño urbano con suela de goma y plantilla acolchada. Unisex.',
            price: 3200,
            oldPrice: null,
            category: 'hombre',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop'],
            badge: 'Popular',
            stock: 25,
            colors: ['#FFFFFF', '#000000', '#808080'],
            reviews: [
                { name: 'Diego F.', rating: 5, text: 'Súper cómodos, los uso todos los días.', date: '2026-01-22' }
            ]
        },
        {
            id: 'p015',
            name: 'Sandalias Mujer Trenzadas',
            description: 'Sandalias con tiras trenzadas de cuero ecológico. Suela antideslizante y diseño artesanal.',
            price: 1600,
            oldPrice: 2000,
            category: 'mujer',
            image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=600&fit=crop',
            images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=600&fit=crop'],
            badge: '-20%',
            badgeType: 'discount',
            stock: 35,
            colors: ['#D2B48C', '#F5F5DC', '#FFFFFF'],
            reviews: []
        }
    ]
};
