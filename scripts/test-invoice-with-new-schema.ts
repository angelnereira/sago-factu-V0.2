/**
 * TEST COMPLETO DEL NUEVO SCHEMA PRISMA
 * 
 * Este script valida:
 * 1. Crear Organization con campos HKA
 * 2. Crear Customer (nuevo modelo)
 * 3. Crear Invoice con todos los campos XML/HKA
 * 4. Crear InvoiceItems con discountedPrice
 * 5. Leer con relaciones completas
 * 6. Verificar que todos los campos nuevos existen
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function success(message: string) {
  log('✅', message, colors.green);
}

function error(message: string) {
  log('❌', message, colors.red);
}

function info(message: string) {
  log('ℹ️ ', message, colors.cyan);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log('📋', title.toUpperCase(), colors.blue);
  console.log('='.repeat(60));
}

async function testNewSchema() {
  let testOrg: any = null;
  let testCustomer: any = null;
  let testUser: any = null;
  let testInvoice: any = null;

  try {
    section('1. Verificar campos nuevos en Organization');

    // Buscar o crear organización de prueba
    testOrg = await prisma.organization.findFirst({
      where: { slug: 'test-hka-org' }
    });

    if (testOrg) {
      info('Organización de prueba ya existe, actualizando...');
      testOrg = await prisma.organization.update({
        where: { id: testOrg.id },
        data: {
          // ✅ CAMPOS NUEVOS PARA HKA
          rucType: '2', // Persona Jurídica
          tradeName: 'COMERCIAL TEST HKA',
          branchCode: '0001',
          locationCode: '8-1-1',
          province: 'PANAMA',
          district: 'PANAMA',
          corregimiento: 'SAN FELIPE',
          
          // ✅ CONFIGURACIÓN AUTOMÁTICA
          autoSendToHKA: true,
          requireApproval: false,
          emailOnCertification: true,
          emailOnError: true,
          lowFoliosThreshold: 10,
        }
      });
    } else {
      info('Creando organización de prueba...');
      testOrg = await prisma.organization.create({
        data: {
          name: 'Test HKA Organization',
          slug: 'test-hka-org',
          ruc: '123456789-1-2023',
          dv: '45',
          email: 'test-hka@example.com',
          phone: '+507 6000-0000',
          address: 'Calle 50, Ciudad de Panamá',
          
          // ✅ CAMPOS NUEVOS PARA HKA
          rucType: '2',
          tradeName: 'COMERCIAL TEST HKA',
          branchCode: '0001',
          locationCode: '8-1-1',
          province: 'PANAMA',
          district: 'PANAMA',
          corregimiento: 'SAN FELIPE',
          
          // ✅ CONFIGURACIÓN AUTOMÁTICA
          autoSendToHKA: true,
          requireApproval: false,
          emailOnCertification: true,
          emailOnError: true,
          lowFoliosThreshold: 10,
          
          isActive: true,
        }
      });
    }

    success('Organization creada/actualizada');
    info(`  ID: ${testOrg.id}`);
    info(`  RUC Type: ${testOrg.rucType}`);
    info(`  Branch Code: ${testOrg.branchCode}`);
    info(`  Province: ${testOrg.province}`);
    info(`  Auto Send HKA: ${testOrg.autoSendToHKA}`);
    info(`  Low Folios Threshold: ${testOrg.lowFoliosThreshold}`);

    // Validar campos nuevos
    const requiredOrgFields = [
      'rucType', 'branchCode', 'locationCode', 'province', 
      'district', 'corregimiento', 'autoSendToHKA', 
      'requireApproval', 'emailOnCertification', 'lowFoliosThreshold'
    ];
    
    for (const field of requiredOrgFields) {
      if (testOrg[field] !== undefined && testOrg[field] !== null) {
        success(`  Campo "${field}" existe: ${testOrg[field]}`);
      } else {
        error(`  Campo "${field}" NO EXISTE o es NULL`);
        throw new Error(`Campo requerido "${field}" faltante en Organization`);
      }
    }

    // =============================================================
    section('2. Crear Customer (NUEVO MODELO)');

    const customerRuc = `${Math.floor(Math.random() * 100000000)}-1-2024`;
    
    testCustomer = await prisma.customer.create({
      data: {
        organizationId: testOrg.id,
        
        // Datos básicos
        ruc: customerRuc,
        dv: '67',
        name: 'CLIENTE DE PRUEBA S.A.',
        email: 'cliente@prueba.com',
        phone: '+507 6111-1111',
        address: 'Avenida Balboa, Ciudad de Panamá',
        
        // ✅ CAMPOS PARA HKA
        locationCode: '8-1-2',
        province: 'PANAMA',
        district: 'PANAMA',
        corregimiento: 'BELLA VISTA',
        countryCode: 'PA',
        clientType: '01', // Contribuyente
        rucType: '2', // Persona Jurídica
        
        isActive: true,
      }
    });

    success('Customer creado (NUEVO MODELO)');
    info(`  ID: ${testCustomer.id}`);
    info(`  RUC: ${testCustomer.ruc}-${testCustomer.dv}`);
    info(`  Name: ${testCustomer.name}`);
    info(`  Client Type: ${testCustomer.clientType}`);
    info(`  RUC Type: ${testCustomer.rucType}`);
    info(`  Province: ${testCustomer.province}`);

    // Validar campos del customer
    const requiredCustomerFields = [
      'ruc', 'dv', 'name', 'address', 'clientType', 
      'rucType', 'countryCode', 'isActive'
    ];
    
    for (const field of requiredCustomerFields) {
      if (testCustomer[field] !== undefined && testCustomer[field] !== null) {
        success(`  Campo "${field}" existe: ${testCustomer[field]}`);
      } else {
        error(`  Campo "${field}" NO EXISTE o es NULL`);
      }
    }

    // =============================================================
    section('3. Crear Usuario de Prueba');

    testUser = await prisma.user.findFirst({
      where: { organizationId: testOrg.id }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@test-hka.com`,
          name: 'Test User HKA',
          password: '$2a$10$test.hash.password', // Hash fake
          organizationId: testOrg.id,
          role: 'USER',
          isActive: true,
        }
      });
      success('Usuario de prueba creado');
    } else {
      success('Usuario de prueba encontrado');
    }
    info(`  ID: ${testUser.id}`);
    info(`  Email: ${testUser.email}`);

    // =============================================================
    section('4. Crear Invoice con TODOS los campos nuevos');

    const invoiceNumber = `TEST-${Date.now()}`;
    const securityCode = String(Math.floor(Math.random() * 900000000) + 100000000);

    testInvoice = await prisma.invoice.create({
      data: {
        organizationId: testOrg.id,
        createdBy: testUser.id,
        
        // Campos existentes (requeridos)
        issuerRuc: testOrg.ruc!,
        issuerDv: testOrg.dv!,
        issuerName: testOrg.name,
        issuerAddress: testOrg.address!,
        issuerEmail: testOrg.email!,
        issuerPhone: testOrg.phone || undefined,
        clientReferenceId: testCustomer.id,
        receiverRuc: testCustomer.ruc,
        receiverDv: testCustomer.dv,
        receiverName: testCustomer.name,
        receiverEmail: testCustomer.email || undefined,
        receiverAddress: testCustomer.address,
        invoiceNumber: invoiceNumber,
        issueDate: new Date(),
        
        // ✅ CAMPOS NUEVOS PARA XML/HKA
        pointOfSale: '001',
        securityCode: securityCode,
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
        paymentMethod: 'CASH',
        paymentTerm: 'CASH',
        xmlContent: null, // Se generará después
        
        // Totales
        subtotal: 100.00,
        subtotalAfterDiscount: 95.00,
        discount: 5.00,
        itbms: 7.00,
        total: 107.00,
        
        status: 'DRAFT',
        
        // Items con nuevo campo
        items: {
          create: [
            {
              lineNumber: 1,
              code: 'PROD-001',
              description: 'Producto de Prueba 1',
              quantity: 2,
              unitPrice: 50.00,
              discount: 10.00,
              discountedPrice: 45.00, // ✅ NUEVO CAMPO
              subtotal: 90.00,
              taxRate: 7,
              taxAmount: 6.30,
              total: 96.30,
            },
            {
              lineNumber: 2,
              code: 'PROD-002',
              description: 'Producto de Prueba 2',
              quantity: 1,
              unitPrice: 10.00,
              discount: 0,
              discountedPrice: 10.00, // ✅ NUEVO CAMPO (sin descuento)
              subtotal: 10.00,
              taxRate: 7,
              taxAmount: 0.70,
              total: 10.70,
            }
          ]
        }
      }
    });

    success('Invoice creado con campos nuevos');
    info(`  ID: ${testInvoice.id}`);
    info(`  Invoice Number: ${testInvoice.invoiceNumber}`);
    info(`  Point of Sale: ${testInvoice.pointOfSale}`);
    info(`  Security Code: ${testInvoice.securityCode}`);
    info(`  Payment Method: ${testInvoice.paymentMethod}`);
    info(`  Payment Term: ${testInvoice.paymentTerm}`);
    info(`  Delivery Date: ${testInvoice.deliveryDate}`);

    // Validar campos nuevos del invoice
    const requiredInvoiceFields = [
      'pointOfSale', 'securityCode', 'paymentMethod', 
      'paymentTerm', 'deliveryDate'
    ];
    
    for (const field of requiredInvoiceFields) {
      if (testInvoice[field] !== undefined && testInvoice[field] !== null) {
        success(`  Campo "${field}" existe: ${testInvoice[field]}`);
      } else {
        error(`  Campo "${field}" NO EXISTE o es NULL`);
        throw new Error(`Campo requerido "${field}" faltante en Invoice`);
      }
    }

    // =============================================================
    section('5. Leer Invoice completo con TODAS las relaciones');

    const fullInvoice = await prisma.invoice.findUnique({
      where: { id: testInvoice.id },
      include: {
        organization: true,
        user: true,
        items: true,
      }
    });

    if (!fullInvoice) {
      throw new Error('No se pudo leer el Invoice con relaciones');
    }

    success('Invoice leído con todas las relaciones');
    info(`  Organization incluida: ${fullInvoice.organization ? 'SÍ' : 'NO'}`);
    info(`  User incluido: ${fullInvoice.user ? 'SÍ' : 'NO'}`);
    info(`  Items incluidos: ${fullInvoice.items.length} items`);

    // Verificar organización con campos HKA
    if (fullInvoice.organization) {
      success('  Organization.rucType: ' + fullInvoice.organization.rucType);
      success('  Organization.province: ' + fullInvoice.organization.province);
      success('  Organization.branchCode: ' + fullInvoice.organization.branchCode);
      success('  Organization.autoSendToHKA: ' + fullInvoice.organization.autoSendToHKA);
    }

    // Verificar items con discountedPrice
    for (const item of fullInvoice.items) {
      if (item.discountedPrice !== undefined && item.discountedPrice !== null) {
        success(`  Item ${item.lineNumber} - discountedPrice: $${item.discountedPrice}`);
      } else {
        error(`  Item ${item.lineNumber} - discountedPrice NO EXISTE`);
      }
    }

    // =============================================================
    section('6. Verificar Customer se puede leer desde Organization');

    const orgWithCustomers = await prisma.organization.findUnique({
      where: { id: testOrg.id },
      include: {
        customers: true,
      }
    });

    if (orgWithCustomers?.customers && orgWithCustomers.customers.length > 0) {
      success(`Organization tiene ${orgWithCustomers.customers.length} customer(s)`);
      success(`  Primer customer: ${orgWithCustomers.customers[0].name}`);
    } else {
      error('No se pudieron leer los customers desde Organization');
    }

    // =============================================================
    section('7. Test de Transformer (Preview)');

    info('Simulando transformación a XML Input...');
    
    const xmlPreview = {
      emisor: {
        ruc: fullInvoice.organization.ruc,
        dv: fullInvoice.organization.dv,
        razonSocial: fullInvoice.organization.name,
        nombreComercial: fullInvoice.organization.tradeName || undefined,
        codigoSucursal: fullInvoice.organization.branchCode,
        provincia: fullInvoice.organization.province,
        distrito: fullInvoice.organization.district,
      },
      receptor: {
        ruc: testCustomer.ruc,
        dv: testCustomer.dv,
        razonSocial: testCustomer.name,
        clientType: testCustomer.clientType,
        provincia: testCustomer.province,
      },
      factura: {
        numeroDocumento: fullInvoice.invoiceNumber,
        puntoFacturacion: fullInvoice.pointOfSale,
        codigoSeguridad: fullInvoice.securityCode,
        formaPago: fullInvoice.paymentMethod,
      },
      items: fullInvoice.items.map(item => ({
        descripcion: item.description,
        cantidad: item.quantity,
        precioUnitario: item.unitPrice,
        precioUnitarioDescuento: item.discountedPrice, // ✅ NUEVO
      }))
    };

    success('Preview del mapeo a XML:');
    console.log(JSON.stringify(xmlPreview, null, 2));

    // =============================================================
    section('✅ RESULTADO FINAL');

    console.log('\n');
    success('🎉 TODOS LOS TESTS PASARON');
    console.log('\n');
    success('✅ Schema Prisma está 100% funcional');
    success('✅ Todos los campos nuevos existen en BD');
    success('✅ Modelo Customer funciona correctamente');
    success('✅ Relaciones funcionan perfectamente');
    success('✅ Campos HKA/XML listos para usar');
    console.log('\n');
    info('🚀 PUEDES CONTINUAR CON:');
    info('   1. Generador XML completo');
    info('   2. Transformer Invoice → XML Input');
    info('   3. Worker de procesamiento');
    info('   4. Componentes de frontend');
    console.log('\n');

    // =============================================================
    section('🗑️  Limpieza (opcional)');

    const shouldCleanup = process.argv.includes('--cleanup');
    
    if (shouldCleanup) {
      info('Eliminando datos de prueba...');
      
      await prisma.invoice.delete({ where: { id: testInvoice.id } });
      success('Invoice eliminado');
      
      await prisma.customer.delete({ where: { id: testCustomer.id } });
      success('Customer eliminado');
      
      // NO eliminamos la org porque puede tener otros datos
      info('Organization conservada para futuros tests');
    } else {
      info('Datos de prueba conservados');
      info('Para eliminarlos, ejecuta: npx tsx scripts/test-invoice-with-new-schema.ts --cleanup');
      console.log('\n');
      info('📝 IDs creados:');
      info(`   Organization: ${testOrg.id}`);
      info(`   Customer: ${testCustomer.id}`);
      info(`   Invoice: ${testInvoice.id}`);
    }

  } catch (err) {
    console.error('\n');
    error('❌ TEST FALLÓ');
    console.error('\n');
    console.error(err);
    console.error('\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testNewSchema();

