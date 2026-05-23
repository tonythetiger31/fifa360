export type CaptionLine = {
  startMs: number;
  endMs: number;
  speaker: "agent" | "business";
  spanish: string;
  english: string;
};

export const transcript: CaptionLine[] = [
  {
    startMs: 5000,
    endMs: 12000,
    speaker: "agent",
    spanish: "Hola, soy de Fifa 360, soy el agente para los clientes que quieren hacer",
    english: "Hello, I'm with Fifa 360, im the agent for clients who wan't to make ",
    },
    {
    startMs: 12000,
    endMs: 16000,
    speaker: "agent",
    spanish: "una reserva en su negocio, tengo curiosidad, ¿a qué juegos jugarán hoy a las 6:00 PM?",
    english: "a reservation at your business, im curious, what games will you be playing at 6:00PM today?",
    },
    {
    startMs: 16000,
    endMs: 22000,
    speaker: "business",
    spanish: "hola buenas tardes, el juego que va a jugar hoy a las 6 de la tarde ",
    english: "Hello, good afternoon. The games that will be played today at 6 pm are",
  },
     {
    startMs: 21000,
    endMs: 31000,
    speaker: "business",
    spanish: "es mexico contra argentina y venezuela contra bolivia",
    english: "Mexico vs. Argentina and Venezuela vs. Bolivia.",
  },
  {
    startMs: 31000,
    endMs: 36000,
    speaker: "agent",
    spanish: "Perfecto, esos son los juegos que mis clientes quieren ver, le encargo que me haga una reservation para 5 personas a las 6 de la tarde",
    english: "Perfect, those are the games my clients want to see. Please make a reservation for 5 people at 6 pm.",
  },
{
    startMs: 36000,
    endMs: 36000,
    speaker: "agent",
    spanish: "ok esta bien hay lo hago gracias",
    english: "Okay, that's fine, I'll do it, thanks.",
  },
];
