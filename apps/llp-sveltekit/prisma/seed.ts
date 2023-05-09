import { Prisma, PrismaClient } from '@prisma/client';

const client = new PrismaClient();

const getUsers = (): Prisma.UserCreateInput[] => [
	{ id: '1', email: 'test1@mail.com' },
	{ id: '2', email: 'test2@mail.com' },
	{ id: '3', email: 'test3@mail.com' }
];

const getKeys = (users: Prisma.UserCreateInput[]): Prisma.KeyCreateInput[] => [
	{
		user: { connect: { id: users[0].id } },
		id: 'email:' + users[0].email,
		hashed_password:
			's2:OEaTlOp5uMHvCHo3:d0aa297b3163ca0507973ad651c92c0980b2009ed1c13caad659a711125ac62f4696e136eca11666597066871d45c08c3bf71928c2823df846fefd256303e838',
		primary: true
	},
	{
		user: { connect: { id: users[1].id } },
		id: 'email:' + users[1].email,
		hashed_password:
			's2:OEaTlOp5uMHvCHo3:d0aa297b3163ca0507973ad651c92c0980b2009ed1c13caad659a711125ac62f4696e136eca11666597066871d45c08c3bf71928c2823df846fefd256303e838',
		primary: true
	},
	{
		user: { connect: { id: users[2].id } },
		id: 'email:' + users[2].email,
		hashed_password:
			's2:OEaTlOp5uMHvCHo3:d0aa297b3163ca0507973ad651c92c0980b2009ed1c13caad659a711125ac62f4696e136eca11666597066871d45c08c3bf71928c2823df846fefd256303e838',
		primary: true
	}
];

const getProperties = (users: Prisma.UserCreateInput[]): Prisma.PropertyCreateInput[] => [
	{
		user: { connect: { id: users[0].id } },
		name: 'User 1 Test Property 1',
		multi_polygon: {}
	},
	{
		user: { connect: { id: users[0].id } },
		name: 'User 1 Test Property 2',
		multi_polygon: {}
	},
	{
		user: { connect: { id: users[1].id } },
		name: 'User 2 Test Property 1',
		multi_polygon: {}
	}
];

const main = async () => {
	const users = await Promise.all(
		getUsers().map((user) =>
			client.user.upsert({
				where: { id: user.id },
				update: { email: user.email },
				create: user,
				select: { id: true, email: true }
			})
		)
	);
	await Promise.all(
		getKeys(users).map((key) =>
			client.key.upsert({
				where: { id: key.id },
				update: key,
				create: key
			})
		)
	);
	await Promise.all(
		getProperties(users).map((property) => client.property.create({ data: property }))
	);
};

main();
