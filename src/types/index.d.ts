// src/types/index.d.ts
export interface Carta {
    id: string;
    titolo: string;
    img: string;
    frontImg: string;
    x: number;
    y: number;
    angle: number;
    scale: number;
    isFront: boolean;
    retro: string | null;
  }
  
  export interface SessionData {
    token: string;
    userId: string;
    userName: string;
    sessionId: string;
    isAdmin: boolean;
    sessione: any;
    carte: Carta[];
  }
  
  export interface PusherConfig {
    app_key: string;
    cluster: string;
    auth_endpoint: string;
    nonce: string;
    debug?: boolean;
  }