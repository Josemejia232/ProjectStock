import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.database import init_db, async_session
from app.models import Proyecto, Material, Inventario, Movimiento, PrecioHistorico, Factura, Requisicion, RequisicionDetalle


async def seed():
    await init_db()
    async with async_session() as db:
        existing = await db.execute(select(Proyecto).limit(1))
        if existing.scalar_one_or_none():
            print("La base de datos ya tiene datos. Omitiendo seed.")
            return

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # Proyectos con nuevos estados
        proys = [
            Proyecto(nombre="Edificio Torres del Parque", descripcion="Edificio residencial de 15 pisos", ubicacion="Av. Principal 123", responsable="Ing. Carlos Mendoza", email="carlos@constructora.com", movil="+52 555 123 4567", estado="ejecucion", fecha_inicio=now - timedelta(days=90)),
            Proyecto(nombre="Puente Vehicular Norte", descripcion="Puente de 200m sobre el río", ubicacion="Carretera Norte km 15", responsable="Ing. Ana García", email="ana@constructora.com", movil="+52 555 234 5678", estado="ejecucion", fecha_inicio=now - timedelta(days=45)),
            Proyecto(nombre="Centro Comercial Plaza Mayor", descripcion="Centro comercial con 80 locales", ubicacion="Zona Centro", responsable="Ing. Roberto Sánchez", email="roberto@constructora.com", movil="+52 555 345 6789", estado="pausado", fecha_inicio=now - timedelta(days=200)),
            Proyecto(nombre="Urbanización Los Pinos", descripcion="Conjunto de 50 viviendas unifamiliares", ubicacion="Vía a la Costa", responsable="Ing. Laura Torres", email="laura@constructora.com", movil="+52 555 456 7890", estado="ejecucion", fecha_inicio=now - timedelta(days=30)),
            Proyecto(nombre="Reparación Hospital Municipal", descripcion="Remodelación y ampliación del ala este", ubicacion="Calle Salud 456", responsable="Ing. Miguel Hernández", email="miguel@constructora.com", movil="+52 555 567 8901", estado="finalizado", fecha_inicio=now - timedelta(days=365), fecha_fin=now - timedelta(days=30)),
        ]
        db.add_all(proys)
        await db.commit()
        for p in proys:
            await db.refresh(p)
        print(f"[OK] {len(proys)} proyectos creados")

        # Materiales con proveedor
        mats = [
            Material(nombre="Cemento Portland", unidad_medida="kg", categoria="Concreto", precio_unitario=12.50, proveedor="Cementos Mexicanos"),
            Material(nombre="Varilla de Acero 3/8", unidad_medida="kg", categoria="Acero", precio_unitario=1.80, proveedor="Aceromex"),
            Material(nombre="Varilla de Acero 1/2", unidad_medida="kg", categoria="Acero", precio_unitario=2.10, proveedor="Aceromex"),
            Material(nombre="Arena Lavada", unidad_medida="m³", categoria="Agregados", precio_unitario=25.00, proveedor="Cantera Los Pinos"),
            Material(nombre="Grava Triturada", unidad_medida="m³", categoria="Agregados", precio_unitario=30.00, proveedor="Cantera Los Pinos"),
            Material(nombre="Ladrillo Macizo", unidad_medida="und", categoria="Mampostería", precio_unitario=0.85, proveedor="Ladrillera Central"),
            Material(nombre="Bloque de Concreto 20x20x40", unidad_medida="und", categoria="Mampostería", precio_unitario=1.50, proveedor="Bloquería industrial"),
            Material(nombre="Yeso", unidad_medida="kg", categoria="Acabados", precio_unitario=0.60, proveedor="Yesos del Norte"),
            Material(nombre="Pintura Blanca", unidad_medida="L", categoria="Acabados", precio_unitario=85.00, proveedor="Pinturas Comex"),
            Material(nombre="Cerámica 60x60", unidad_medida="m²", categoria="Acabados", precio_unitario=350.00, proveedor="Cerámica Azteca"),
            Material(nombre="Tubería PVC 2\"", unidad_medida="m", categoria="Hidrosanitaria", precio_unitario=42.00, proveedor="Tubos PVC"),
            Material(nombre="Cable THW #12", unidad_medida="m", categoria="Eléctrico", precio_unitario=11.00, proveedor="Cables Eléctricos"),
            Material(nombre="Interruptor Sencillo", unidad_medida="und", categoria="Eléctrico", precio_unitario=35.00, proveedor="Lumina Electric"),
            Material(nombre="Madera Encofrado", unidad_medida="m²", categoria="Madera", precio_unitario=150.00, proveedor="Madera Selecta"),
            Material(nombre="Clavo 2\"", unidad_medida="kg", categoria="Ferretería", precio_unitario=45.00, proveedor="Ferretería Industrial"),
        ]
        db.add_all(mats)
        await db.commit()
        for m in mats:
            await db.refresh(m)
        print(f"[OK] {len(mats)} materiales creados")

        # Registrar precios históricos (para mostrar alertas de cambio de precio)
        precios_historicos = [
            PrecioHistorico(material_id=mats[0].id, precio_anterior=10.00, precio_nuevo=12.50, fecha=now - timedelta(days=7)),
            PrecioHistorico(material_id=mats[1].id, precio_anterior=1.50, precio_nuevo=1.80, fecha=now - timedelta(days=15)),
            PrecioHistorico(material_id=mats[3].id, precio_anterior=22.00, precio_nuevo=25.00, fecha=now - timedelta(days=3)),
            PrecioHistorico(material_id=mats[8].id, precio_anterior=75.00, precio_nuevo=85.00, fecha=now - timedelta(days=10)),
            PrecioHistorico(material_id=mats[9].id, precio_anterior=300.00, precio_nuevo=350.00, fecha=now - timedelta(days=20)),
        ]
        db.add_all(precios_historicos)
        await db.commit()
        print(f"[OK] {len(precios_historicos)} precios historicos creados (alertas de cambio)")

        # Inventario
        inv_data = [
            (proys[0], mats[0], 150, 50, 300),
            (proys[0], mats[1], 500, 200, 1000),
            (proys[0], mats[3], 12, 5, 30),
            (proys[0], mats[4], 18, 5, 35),
            (proys[0], mats[5], 8000, 2000, 10000),
            (proys[0], mats[7], 300, 100, 500),
            (proys[0], mats[8], 25, 10, 60),
            (proys[0], mats[11], 200, 50, 400),
            (proys[1], mats[0], 500, 100, 600),
            (proys[1], mats[1], 2000, 500, 2500),
            (proys[1], mats[2], 1500, 300, 2000),
            (proys[1], mats[3], 40, 10, 50),
            (proys[1], mats[4], 45, 10, 55),
            (proys[1], mats[13], 200, 50, 300),
            (proys[2], mats[0], 20, 100, 400),
            (proys[2], mats[6], 200, 1000, 5000),
            (proys[2], mats[9], 5, 50, 200),
            (proys[2], mats[10], 30, 50, 200),
            (proys[3], mats[0], 80, 100, 500),
            (proys[3], mats[5], 3000, 5000, 15000),
            (proys[3], mats[6], 500, 1000, 5000),
            (proys[3], mats[8], 5, 20, 80),
            (proys[3], mats[14], 0, 10, 50),
            (proys[4], mats[0], 0, 0, 200),
            (proys[4], mats[8], 2, 5, 30),
            (proys[4], mats[11], 150, 0, 300),
            (proys[4], mats[12], 10, 0, 50),
        ]

        inventarios = []
        for proy, mat, actual, minima, maxima in inv_data:
            inv = Inventario(proyecto_id=proy.id, material_id=mat.id, cantidad_actual=actual, cantidad_minima=minima, cantidad_maxima=maxima)
            db.add(inv)
            inventarios.append(inv)
        await db.commit()
        for inv in inventarios:
            await db.refresh(inv)
        print(f"[OK] {len(inventarios)} registros de inventario creados")

        # Movimientos
        movs_data = [
            (proys[0], mats[0], "entrada", 200, "Compra inicial", "Admin", "REM-001"),
            (proys[0], mats[0], "salida", 50, "Uso en cimentación", "Admin", ""),
            (proys[0], mats[1], "entrada", 800, "Compra acero", "Admin", "REM-002"),
            (proys[0], mats[1], "salida", 300, "Armado de columnas", "Admin", ""),
            (proys[0], mats[5], "entrada", 10000, "Compra ladrillos", "Admin", "REM-003"),
            (proys[0], mats[5], "salida", 2000, "Muros primer piso", "Admin", ""),
            (proys[1], mats[0], "entrada", 600, "Compra cemento puente", "Admin", "REM-004"),
            (proys[1], mats[0], "salida", 100, "Vaciado de estribos", "Admin", ""),
            (proys[1], mats[1], "entrada", 2500, "Compra acero puente", "Admin", "REM-005"),
            (proys[1], mats[1], "salida", 500, "Armado vigas", "Admin", ""),
            (proys[1], mats[13], "entrada", 300, "Compra madera encofrado", "Admin", "REM-006"),
            (proys[1], mats[13], "salida", 100, "Encofrado de losa", "Admin", ""),
            (proys[2], mats[0], "entrada", 500, "Compra inicial centro comercial", "Admin", "REM-007"),
            (proys[2], mats[0], "salida", 480, "Uso en losa", "Admin", ""),
            (proys[3], mats[0], "entrada", 300, "Compra inicial urbanización", "Admin", "REM-008"),
            (proys[3], mats[0], "salida", 220, "Cimentación casas 1-10", "Admin", ""),
            (proys[3], mats[6], "entrada", 3000, "Compra bloques", "Admin", "REM-009"),
            (proys[3], mats[6], "salida", 2500, "Muros casas 1-10", "Admin", ""),
            (proys[4], mats[8], "entrada", 15, "Compra pintura hospital", "Admin", "REM-010"),
            (proys[4], mats[8], "salida", 13, "Pintura ala este", "Admin", ""),
            (proys[4], mats[11], "entrada", 200, "Cableado eléctrico", "Admin", "REM-011"),
            (proys[4], mats[11], "salida", 50, "Instalación eléctrica", "Admin", ""),
        ]

        movimientos = []
        i = 0
        for proy, mat, tipo, cantidad, desc, usuario, norem in movs_data:
            m = Movimiento(
                proyecto_id=proy.id, material_id=mat.id, tipo=tipo, cantidad=cantidad,
                descripcion=desc, usuario=usuario, no_remision=norem,
                fecha=now - timedelta(days=len(movs_data) - i, hours=i * 3),
            )
            db.add(m)
            movimientos.append(m)
            i += 1
        await db.commit()
        print(f"[OK] {len(movimientos)} movimientos creados")

        # Facturas
        facturas = [
            Factura(fecha=now - timedelta(days=30), no_factura="F-001", proveedor="Cementos Mexicanos", insumo="Cemento Portland 500 bolsas", valor=6250.00),
            Factura(fecha=now - timedelta(days=28), no_factura="F-002", proveedor="Aceromex", insumo="Varilla de Acero 3/8 - 2000 kg", valor=3600.00),
            Factura(fecha=now - timedelta(days=25), no_factura="F-003", proveedor="Cantera Los Pinos", insumo="Arena Lavada 20 m³", valor=500.00),
            Factura(fecha=now - timedelta(days=22), no_factura="F-004", proveedor="Ladrillera Central", insumo="Ladrillo Macizo 10000 uds", valor=8500.00),
            Factura(fecha=now - timedelta(days=20), no_factura="F-005", proveedor="Pinturas Comex", insumo="Pintura Blanca 50 galones", valor=4250.00),
            Factura(fecha=now - timedelta(days=18), no_factura="F-006", proveedor="Tubos PVC", insumo="Tubería PVC 2\" 100 m", valor=4200.00),
            Factura(fecha=now - timedelta(days=15), no_factura="F-007", proveedor="Cables Eléctricos", insumo="Cable THW #12 500 m", valor=5500.00),
            Factura(fecha=now - timedelta(days=12), no_factura="F-008", proveedor="Cerámica Azteca", insumo="Cerámica 60x60 30 m²", valor=10500.00),
            Factura(fecha=now - timedelta(days=10), no_factura="F-009", proveedor="Aceromex", insumo="Varilla de Acero 1/2 - 1500 kg", valor=3150.00),
            Factura(fecha=now - timedelta(days=5), no_factura="F-010", proveedor="Madera Selecta", insumo="Madera Encofrado 50 m²", valor=7500.00),
        ]
        db.add_all(facturas)
        await db.commit()
        print(f"[OK] {len(facturas)} facturas creadas")

        # Requisiciones
        reqs_data = [
            (proys[0], "Ing. Carlos Mendoza", "Muros primer piso - Edificio Torres", [
                ("Varilla para columnas", 500, "kg"),
                ("Cemento para losa", 100, "kg"),
            ]),
            (proys[0], "Ing. Carlos Mendoza", "Fachada - Edificio Torres", [
                ("Arena para repellos", 10, "m³"),
            ]),
            (proys[3], "Ing. Laura Torres", "Cimentación casas 1-10", [
                ("Bloques para muros", 3000, "und"),
                ("Cemento para pega", 200, "kg"),
            ]),
        ]

        for proy, resi, dest, detalles_data in reqs_data:
            no_req = f"REQ-{proy.id}-{proy.id}01"
            req = Requisicion(proyecto_id=proy.id, residente=resi, no_requisicion=no_req, destino_uso=dest)
            for mat_sol, cant, und in detalles_data:
                req.detalles.append(RequisicionDetalle(
                    material_solicitado=mat_sol,
                    cantidad_solicitada=cant,
                    unidad=und,
                ))
            db.add(req)
        await db.commit()
        print(f"[OK] {len(reqs_data)} requisiciones creadas")

    print("\n[OK] Base de datos poblada con datos de prueba exitosamente.")


if __name__ == "__main__":
    asyncio.run(seed())