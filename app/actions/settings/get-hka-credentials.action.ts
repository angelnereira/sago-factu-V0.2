'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function getHkaCredentials() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const credentials = await prisma.hKACredential.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!credentials) {
      return { 
        success: true, 
        data: null 
      };
    }

    return {
      success: true,
      data: {
        tokenUser: credentials.tokenUser,
        environment: credentials.environment,
      },
    };
  } catch (error) {
    console.error('Error fetching HKA credentials:', error);
    return { 
      success: false, 
      error: 'Failed to load credentials' 
    };
  }
}
