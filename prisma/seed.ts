// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Nettoie la DB
    await prisma.activity.deleteMany()
    await prisma.invoiceLine.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.quoteLine.deleteMany()
    await prisma.quote.deleteMany()
    await prisma.customer.deleteMany()

    // Crée des clients
    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                name: 'ACME Corp',
                email: 'contact@acme.com',
                phone: '0123456789',
                address: '123 Rue de la Paix, 75001 Paris',
            },
        }),
        prisma.customer.create({
            data: {
                name: 'TechStart SAS',
                email: 'hello@techstart.fr',
                phone: '0987654321',
                address: '45 Avenue des Champs, 75008 Paris',
            },
        }),
        prisma.customer.create({
            data: {
                name: 'DevCorp',
                email: 'dev@devcorp.io',
                phone: '0612345678',
                address: '78 Boulevard Voltaire, 75011 Paris',
            },
        }),
    ])

    console.log(`✅ Created ${customers.length} customers`)

    // Crée des devis
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5)

    const quote1 = await prisma.quote.create({
        data: {
            num: '2025-001',
            customerId: customers[0].id,
            status: 'ACCEPTED',
            title: 'Site web vitrine',
            totalAmount: 2500,
            createdAt: lastMonth,
            lines: {
                create: [
                    { description: 'Design UI/UX', unitPrice: 800, quantity: 1 },
                    { description: 'Développement frontend', unitPrice: 1200, quantity: 1 },
                    { description: 'Hébergement 1 an', unitPrice: 500, quantity: 1 },
                ],
            },
        },
    })

    const quote2 = await prisma.quote.create({
        data: {
            num: '2025-002',
            customerId: customers[1].id,
            status: 'ACCEPTED',
            title: 'Application mobile',
            totalAmount: 4500,
            createdAt: thisMonth,
            lines: {
                create: [
                    { description: 'Développement iOS', unitPrice: 2000, quantity: 1 },
                    { description: 'Développement Android', unitPrice: 2000, quantity: 1 },
                    { description: 'API Backend', unitPrice: 500, quantity: 1 },
                ],
            },
        },
    })

    const quote3 = await prisma.quote.create({
        data: {
            num: '2025-003',
            customerId: customers[2].id,
            status: 'SENT',
            title: 'Refonte site e-commerce',
            totalAmount: 3800,
            expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 jours
            lines: {
                create: [
                    { description: 'Audit technique', unitPrice: 500, quantity: 1 },
                    { description: 'Refonte graphique', unitPrice: 1200, quantity: 1 },
                    { description: 'Développement', unitPrice: 2100, quantity: 1 },
                ],
            },
        },
    })

    const quote4 = await prisma.quote.create({
        data: {
            num: '2025-004',
            customerId: customers[0].id,
            status: 'SENT',
            title: 'Maintenance annuelle',
            totalAmount: 1200,
            expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // +1 jour (expire bientôt!)
            lines: {
                create: [
                    { description: 'Support technique', unitPrice: 100, quantity: 12 },
                ],
            },
        },
    })

    console.log('✅ Created 4 quotes')

    // Crée des factures
    const invoice1 = await prisma.invoice.create({
        data: {
            num: '2025-001',
            customerId: customers[0].id,
            quoteId: quote1.id,
            status: 'PAID',
            title: 'Facture - Site web vitrine',
            dueDate: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
            emitDate: lastMonth,
            lines: {
                create: [
                    { description: 'Design UI/UX', unitPrice: 800, quantity: 1 },
                    { description: 'Développement frontend', unitPrice: 1200, quantity: 1 },
                    { description: 'Hébergement 1 an', unitPrice: 500, quantity: 1 },
                ],
            },
        },
    })

    const invoice2 = await prisma.invoice.create({
        data: {
            num: '2025-002',
            customerId: customers[1].id,
            status: 'UNPAID',
            title: 'Facture - Application mobile',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 jours
            emitDate: thisMonth,
            lines: {
                create: [
                    { description: 'Développement iOS', unitPrice: 2000, quantity: 1 },
                    { description: 'Développement Android', unitPrice: 2000, quantity: 1 },
                    { description: 'API Backend', unitPrice: 500, quantity: 1 },
                ],
            },
        },
    })

    const invoice3 = await prisma.invoice.create({
        data: {
            num: '2025-003',
            customerId: customers[2].id,
            quoteId: quote2.id,
            status: 'UNPAID',
            title: 'Facture - Consultation',
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // -5 jours (en retard!)
            emitDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
            lines: {
                create: [
                    { description: 'Consultation technique', unitPrice: 500, quantity: 1 },
                ],
            },
        },
    })

    console.log('✅ Created 3 invoices')

    // Crée des activités
    await prisma.activity.createMany({
        data: [
            {
                type: 'QUOTE_CREATED',
                quoteId: quote1.id,
                customerId: customers[0].id,
                createdAt: lastMonth,
            },
            {
                type: 'QUOTE_ACCEPTED',
                quoteId: quote1.id,
                customerId: customers[0].id,
                createdAt: new Date(lastMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
            },
            {
                type: 'INVOICE_CREATED',
                invoiceId: invoice1.id,
                customerId: customers[0].id,
                createdAt: new Date(lastMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
            },
            {
                type: 'INVOICE_PAID',
                invoiceId: invoice1.id,
                customerId: customers[0].id,
                createdAt: new Date(lastMonth.getTime() + 10 * 24 * 60 * 60 * 1000),
            },
            {
                type: 'QUOTE_CREATED',
                quoteId: quote2.id,
                customerId: customers[1].id,
                createdAt: thisMonth,
            },
            {
                type: 'QUOTE_SENT',
                quoteId: quote3.id,
                customerId: customers[2].id,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
        ],
    })

    console.log('✅ Created activities')

    console.log('🎉 Seeding complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })