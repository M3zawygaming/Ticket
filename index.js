require("dotenv").config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ChannelType, PermissionsBitField, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.content === "!setup" && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    const select = new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder("🎫 اختر نوع التذكرة")
      .addOptions([
        { label: "🛠 تقديم على الإدارة", value: "admin", emoji: "🛠" },
        { label: "🐛 الإبلاغ عن مشكلة", value: "bug", emoji: "🐛" },
        { label: "❓ استفسار", value: "ask", emoji: "❓" },
        { label: "💸 شراء رتبة", value: "buy", emoji: "💸" }
      ]);

    const row = new ActionRowBuilder().addComponents(select);

    const embed = new EmbedBuilder()
      .setTitle("🎫 فتح تذكرة دعم")
      .setDescription("اختر نوع التذكرة من القائمة أدناه:")
      .setColor("#2f3136");

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "ticket_select") return;

  const types = {
    admin: "تقديم على الإدارة",
    bug: "الإبلاغ عن مشكلة",
    ask: "استفسار",
    buy: "شراء رتبة"
  };

  const value = interaction.values[0];
  const type = types[value];
  if (!type) return;

  const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
  if (existing) return interaction.reply({ content: "❌ لديك تذكرة مفتوحة بالفعل.", ephemeral: true });

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.id}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      }
    ]
  });

  const closeButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 قفل التذكرة")
      .setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle(`🎟 ${type}`)
    .setDescription("أحد أعضاء الفريق سيرد عليك قريبًا. يمكنك الضغط على الزر بالأسفل لإغلاق التذكرة.")
    .setColor("#2f3136");

  await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [closeButton] });
  await interaction.reply({ content: `✅ تم فتح التذكرة: ${channel}`, ephemeral: true });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "close_ticket") return;

  if (!interaction.channel.name.startsWith("ticket-")) {
    return interaction.reply({ content: "❌ هذا ليس روم تذكرة!", ephemeral: true });
  }

  await interaction.reply({ content: "🗑️ سيتم حذف هذه التذكرة خلال 5 ثوانٍ..." });
  setTimeout(() => {
    interaction.channel.delete().catch(console.error);
  }, 5000);
});

client.login(process.env.TOKEN);
