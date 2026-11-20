export interface Competition{id:string;name:string;organizerName:string;logoUrl?:string;coverUrl?:string;ownerId:string;followers:string[]}
export interface Organizer{id:string;name:string;logoUrl?:string;country:string;region?:string}
export interface Activity{id:string;type:"result";homePlayer:string;awayPlayer:string;competitionId:string;createdAt:{toMillis():number}}
export interface Stage{id:string;name:string;order:number}
export interface Round{id:string;stageId:string;name:string;order:number;ko?:boolean}
export interface Player{id:string;name:string;logoUrl?:string;teamId?:string|null;groupId?:string|null;ownLogo?:string|null}
export interface Match{id:string;competitionId:string;stageId:string;roundId:string;homeId:string;awayId:string;homeName:string;awayName:string;homeLogo?:string;awayLogo?:string;homeScore?:number;awayScore?:number;status:"upcoming"|"done";date?:string;homeAssists?:number;awayAssists?:number;homePens?:number;awayPens?:number;groupId?:string|null;ko?:boolean;third?:boolean;slot?:number;rIdx?:number;total?:number}
