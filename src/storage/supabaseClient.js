// src/storage/supabaseClient.js
// Fase 1 (spec-fase1-fundacao-online.md): client do Supabase pro modo online
// (login + carreira online + ranking). Só é usado pela tela Online — o Modo 1
// (ligas oficiais offline) nunca depende disso (doc-mãe §4).
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sem as chaves (.env.local ausente, ex. build de terceiro sem Supabase
// configurado): a tela Online avisa e não quebra o resto do app.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
