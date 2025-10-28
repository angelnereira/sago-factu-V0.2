/**
 * API: Crear Colección por Defecto
 * POST /api/collections/create-default
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaServer as prisma } from '@/lib/prisma-server';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Crear colección de prueba para HKA
    const collection = await prisma.collection.create({
      data: {
        name: 'HKA API Tests',
        description: 'Colección de pruebas para métodos HKA',
        definition: {
          requests: [
            {
              name: 'Test HKA Health',
              method: 'GET',
              url: 'https://httpbin.org/status/200',
              headers: {
                'User-Agent': 'SAGO-FACTU-Monitor/1.0'
              }
            },
            {
              name: 'Test HKA Timeout',
              method: 'GET', 
              url: 'https://httpbin.org/delay/2',
              headers: {
                'User-Agent': 'SAGO-FACTU-Monitor/1.0'
              }
            }
          ]
        },
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear colección por defecto' },
      { status: 500 }
    );
  }
}

