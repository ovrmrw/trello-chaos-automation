export type ID = string;

export interface BoardModel {
  id: ID;
  name: string;
  lists: ListModel[];
  pluginData: PluginDataModel[];
}

export interface ListModel {
  id: ID;
  name: string;
  closed: boolean;
  idBoard: string;
  pos: number;
}

export interface CustomCardModel {
  _listName: string;
  _daysFromLastActivity: number;
  _allCheckItemsComplete: boolean;
  _storyPoint: number | null;
  _leadtime: number | null;
  _assignMembers: boolean;
  _hasLabels: boolean;
  _releaseStatus: 'OK' | string;
}

export interface CardModel extends CustomCardModel {
  id: string;
  closed: boolean;
  dateLastActivity: string;
  desc: string;
  idBoard: ID;
  idList: ID;
  idLabels: ID[];
  name: string;
  pos: number;
  idMembers: ID[];
  idChecklists: ID[];
  labels: LabelModel[];
  checklists: CheckListModel[];
  pluginData: PluginDataModel[];
}

export interface LabelModel {
  id: string;
  idBoard: string;
  name: string;
  color: string;
  uses: number;
}

export interface PluginDataModel {
  id: ID;
  idPlugin: ID;
  scope: string;
  idModel: ID;
  value: string;
  access: string;
}

export interface MemberModel {
  'id': ID;
  'fullName': string;
  'username': string;
}

export interface CheckListModel {
  'id': ID;
  'name': string;
  'idBoard': ID;
  'idCard': ID;
  'pos': number;
  'checkItems': CheckItemModel[];
}

export interface CheckItemModel {
  'state': 'complete' | 'incomplete';
  'idChecklist': ID;
  'id': ID;
  'name': string;
  'nameData': null;
  'pos': number;
}
