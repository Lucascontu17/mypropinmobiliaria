# 00-ALCANCE DEL PROYECTO

## Descripción General
El Panel Administrativo de MyProp es una aplicación web B2B diseñada para que las inmobiliarias gestionen su operación diaria de manera integral, segura y escalable.

## Objetivos Principales
- **Gestión Integral**: Centralizar el inventario de propiedades, la relación con actores (inquilinos/propietarios) y el ciclo de vida de contratos.
- **Automatización Financiera**: Resolver la cobranza mensual, liquidaciones y rollover de deudas sin intervención manual propensa a errores.
- **Expansión Regional**: Soportar múltiples mercados (AR, MX, US) con dialectos y monedas locales desde una única base de código.
- **Seguridad "Zero Leaks"**: Garantizar el aislamiento de datos entre inmobiliarias mediante un sistema de Master Filter (`inmobiliaria_id`).

## Público Objetivo
- Inmobiliarias pequeñas y medianas que buscan una solución premium y moderna.
- Administradores de fincas que requieren control sobre cobranzas y notificaciones automáticas.

## Exclusiones (Out of Scope)
- No es una plataforma de búsqueda para el usuario final (eso corresponde a `mypropLand`).
- No es un sistema de mensajería directa (usa Twilio/SendGrid para notificaciones automáticas).
- No gestiona reparaciones o mantenimiento físico de las propiedades en esta fase.
