# IceCream API 🐼🍦

FastAPI + SQLAlchemy + Oracle Autonomous + Mercado Pago (sandbox).

## Local
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
Docs: http://localhost:8000/docs (SQLite por defecto)

## Docker
```bash
docker build -t icecream-api .
docker run -p 8000:8000 --env-file .env icecream-api
```

## Oracle Autonomous
1. Descargá el *wallet* (Instance wallet) y descomprimilo en `./wallet`.
2. `.env`: `DATABASE_URL=oracle+oracledb://ADMIN:PASS@<alias_de_tnsnames>`, `ORACLE_WALLET_DIR=/srv/wallet`, `ORACLE_WALLET_PASSWORD=...`
3. En Render, subí el wallet como *Secret File* o copialo en la imagen (no lo commitees).

## Render
Conectá el repo, Render detecta `render.yaml`. Cargá las variables marcadas `sync: false`.

## Mercado Pago (sandbox)
1. Entrá a https://www.mercadopago.com.ar/developers → **Tus integraciones** → creá una aplicación (Checkout Pro).
2. En la aplicación, abrí **Cuentas de prueba** y creá dos: **Vendedor** y **Comprador** (anotá usuario y contraseña de cada una).
3. Iniciá sesión con la cuenta de prueba **vendedora**, creá una aplicación y copiá su **Access Token** → `MP_ACCESS_TOKEN` en el `.env`.
4. Reiniciá el backend. En la web, creá un pedido y tocá **Pagar con Mercado Pago**.
5. En una ventana de **incógnito**, iniciá sesión en Mercado Pago con la cuenta de prueba **compradora** y pagá con una tarjeta de prueba (Mastercard `5031 7557 3453 0604`, código `123`, vencimiento `11/30`). El nombre del titular define el resultado: `APRO` = aprobado.
6. Al volver a la web, el pedido se confirma solo (`POST /orders/{id}/sync`). El webhook (`/payments/webhook`) solo funciona con una URL pública (https), por eso en local se usa esa confirmación.

## Panel de administrador
Poné tu email en `ADMIN_EMAILS` del `.env`, registrate con ese email y aparece **Admin** en la barra: ver todos los pedidos, cambiar su estado y gestionar los gustos.

## Endpoints
`POST /auth/register|login|refresh|change-password` · `GET /auth/me` · `GET /flavors` · `POST /orders` · `GET /orders/me` · `POST /orders/{id}/pay` · `POST /orders/{id}/sync` · `POST /payments/webhook` · `/admin/orders` · `/admin/flavors`
