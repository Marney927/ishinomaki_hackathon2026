import { create } from "zustand/react"
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/states/users.ts"

export interface GuildsState {

  guilds: Guild[]
  addNewGuild: (name: string) => Promise<void>
  editGuildName: (id: number, name: string) => Promise<void>
  editGuildDescription: (id: number, description: string) => Promise<void>
  editGuildInviteCode: (id: number) => Promise<void>
  editGuildMaster: (id: number, uuid: string) => Promise<void>
  joinGuildBySecretUuid: (uuid: string) => Promise<void>
  deleteGuildMember: (id: number, uuid: string) => Promise<void>
  deleteGuild: (id: number) => Promise<void>
  getGuildInviteCode: (id: number) => Promise<string>;
}

export const useGuildsState = create<GuildsState>((set, get) => ({
  guilds: [],
  addNewGuild: async (name: string) => {
    const supabase = createClient();
    const { data: guildId,error } = await supabase.rpc(
      "create_guild",
      {
        p_name: name
      }
    );

    if (error !== null) {
      // 作成エラー
      throw error;
    }

    // 新規作成したデータを取得  
    const { data: guildData, error: guildError } = await supabase
    .from("guilds")
      .select(`
        id,
        name,
        description,
        owner_id,
        profiles!guilds_owner_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
    .eq("id", guildId)
    .single();

    if (guildError !== null) {
      // 取得エラー
      throw guildError;
    }

    if (guildData === null){
      throw new Error("ギルド情報を取得できませんでした");;
    }

    const displayDescription = guildData.description ?? "";
    const profile = guildData.profiles[0];
    const owner: User = {
      id: profile.id,
      name: profile.display_name ?? "",
      avatar_url: profile.avatar_url,
    };

    const { count, error: countError } = await supabase
      .from("guild_members")
      .select("*", { count: "exact", head: true })
      .eq("guild_id", guildId);

    if (countError !== null) {
      throw countError;
    }

    const memberCount = count ?? 0;
    
    const newGuild: Guild = {
      id: guildData.id,
      name: guildData.name,
      owner,
      description: displayDescription,
      member_count: memberCount,
    };
    // 正常にデータ取得できたら配列に追加する
    set((state) => ({
      guilds: [...state.guilds, newGuild]
    }));
  },

  editGuildName: async (id: number, name: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("guilds")
      .update({ name })
      .eq("id", id)
      .select("id")
      .single();
    if (error !== null) {
      // 更新エラー
      throw error;
    }

    // 正常に更新できたら配列も更新する
    set((state) => ({
      guilds: state.guilds.map((guild) =>
        guild.id === id
          ? { ...guild, name: name }
          : guild
      )
    }));
  },

  editGuildDescription: async (id: number, description: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("guilds")
      .update({ description })
      .eq("id", id)
      .select("id")
      .single();
    if (error !== null) {
      // 更新エラー
      throw error;
    }

    // 正常に更新できたら配列も更新する
    set((state) => ({
      guilds: state.guilds.map((guild) =>
        guild.id === id
          ? { ...guild, description: description }
          : guild
      )
    }));
  },

  editGuildInviteCode: async (id: number) => {
    const supabase = createClient();
    const { error } = await supabase.rpc(
      "rotate_guild_invite_code",
      {
        p_guild_id: id
      }
    );
    if (error !== null) {
      // 更新エラー
      throw error;
    }
  },

  editGuildMaster: async (id: number, uuid: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("guilds")
      .update({ owner_id: uuid })
      .eq("id", id)
      .select("id")
      .single();
    if (error !== null) {
      // 更新エラー
      throw error;
    }

    // 新ギルドマスターのprofileデータを取得  
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select(`
        id,
        display_name,
        avatar_url
      `)
      .eq("id", uuid)
      .single();

    if (userError !== null) {
      // 取得エラー
      throw userError;
    }
    if (userData === null) {
      throw new Error("新しいギルドマスターの情報を取得できませんでした");
    }

    const newOwner: User = {
      id: userData.id,
      name: userData.display_name ?? "",
      avatar_url: userData.avatar_url,
    };

    // 正常に更新できたら配列も更新する
    set((state) => ({
      guilds: state.guilds.map((guild) =>
        guild.id === id
          ? { ...guild, owner: newOwner }
          : guild
      )
    }));
  },

  joinGuildBySecretUuid: async (uuid: string) => {
    const supabase = createClient();

    // RPCを実行
    const { data: guildId, error: joinError } = await supabase.rpc(
      "join_guild",
      {
        p_secret: uuid,
      }
    );
    if (joinError !== null) {
      // エラー
      throw joinError;
    }
    if (guildId === null) {
      throw new Error("参加先のギルドIDを取得できませんでした");
    }

    // 新規加入しギルドのデータを取得  
    const { data: guildData, error: guildError } = await supabase
      .from("guilds")
      .select(`
        id,
        name,
        description,
        owner_id,
        profiles!guilds_owner_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq("id", guildId)
      .single();

    if (guildError !== null) {
      // 取得エラー
      throw guildError;
    }

    if (guildData === null) {
      throw new Error("ギルド情報を取得できませんでした");;
    }

    // guilds配列に現在参照しているギルド情報があるかを確認する
    const result = get().guilds.some((guild) => guild.id === guildData.id);
    if (!result){
      // ギルド情報が配列に存在しない場合のみ追加処理を実施
      const displayDescription = guildData.description ?? "";
      const profile = guildData.profiles[0];
      if (profile === undefined) {
        throw new Error("オーナー情報を取得できませんでした");
      }
      const owner: User = {
        id: profile.id,
        name: profile.display_name ?? "",
        avatar_url: profile.avatar_url,
      };

      const { count, error: countError } = await supabase
        .from("guild_members")
        .select("*", { count: "exact", head: true })
        .eq("guild_id", guildId);

      if (countError !== null) {
        throw countError;
      }

      const memberCount = count ?? 0;

      const newGuild: Guild = {
        id: guildData.id,
        name: guildData.name,
        owner,
        description: displayDescription,
        member_count: memberCount,
      };
      // 正常にデータ取得できたら配列に追加する
      set((state) => ({
        guilds: state.guilds.some(
          (guild) => guild.id === newGuild.id
        )
          ? state.guilds
          : [...state.guilds, newGuild]
      }));
    }
  },

  deleteGuildMember: async (id: number, uuid: string) => {
    const supabase = createClient();
    const { error } = await supabase.rpc(
      "remove_guild_member",
      {
        p_guild_id: id,
        p_user_id: uuid,
      }
    );
    if (error !== null) {
      // 更新エラー
      throw error;
    }
    // 正常に更新できたら配列も更新する
    set((state) => ({
      guilds: state.guilds.map((guild) =>
        guild.id === id
          ? { ...guild, member_count: guild.member_count - 1 }
          : guild
      )
    }));
  },

  deleteGuild: async (id: number) => {
    const supabase = createClient();
    const { error } = await supabase.rpc(
      "delete_guild",
      {
        p_guild_id: id,
      }
    );
    if (error !== null) {
      // 更新エラー
      throw error;
    }
    // 正常に更新できたら配列から削除する
    set((state) => ({
      guilds: state.guilds.filter((guild) =>
        guild.id !== id
      )
    }));
  },
  
  getGuildInviteCode: async  (id: number) => {
    const supabase = createClient();
    const { data: guildSecret, error: guildError } = await supabase
      .from("guilds")
      .select(`
        secret_uuid_v4
      `)
      .eq("id", id)
      .single();
    if (guildError !== null) {
      // 取得エラー
      throw guildError;
    }

    if (guildSecret === null) {
      throw new Error("招待コードを取得できませんでした");
    }

    if (guildSecret.secret_uuid_v4 === null) {
      throw new Error("招待コードが設定されていません");
    }

    return guildSecret.secret_uuid_v4;
  },
}))

export type Guild = {
  id: number
  name: string
  owner: User
  description: string
  member_count: number
}
