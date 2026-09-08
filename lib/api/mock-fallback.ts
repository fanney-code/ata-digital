import {
  Student,
  Registration,
  Institution,
  Department,
  Program,
  WorkflowStatus,
  RegistrationType,
  DashboardMetrics,
  ActorContext,
} from '../types';
import {
  extractYear,
  findLowestUnusedUidSequence,
  findNextRegistrationSequence,
} from './id-generator';
import { isAadharMatch, normalizeAadhar, maskAadhar } from '../utils/aadhar';

export const INITIAL_INSTITUTIONS: Institution[] = [
  {
    "id": "78901240-699c-4cc0-bd40-648133a8b1a6",
    "name": "Academy for Church Planting & Leadership",
    "code": "ACPL",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "1d9e49ea-3bab-4d7f-b834-3b93d9fc6b94",
    "name": "Academy for Theology and Missions",
    "code": "ATM",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "1c647eba-d300-4542-b586-a2f704e90300",
    "name": "Academy of Integrated Christian Studies",
    "code": "AICS",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "225234d7-6623-42db-8ac8-033a812f4b01",
    "name": "ACTS Academy of Higher Education",
    "code": "AAHE",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "84261bdf-bbcd-40a3-8ad4-0f589f6151a8",
    "name": "AG Tamilnadu Bible College",
    "code": "ATBC",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "d1f0528f-69ff-47e3-a4f1-0711a9fa5d25",
    "name": "AGAPE College",
    "code": "AGAPE",
    "created_at": "2026-09-06T07:32:36.418976+00:00"
  },
  {
    "id": "86dc17fa-696d-449e-bdc0-fda704ad269c",
    "name": "All Nations Theological Seminary",
    "code": "ANTS",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "50a48f4a-7142-4462-97ab-bc06aaf0036b",
    "name": "Allahabad Bible Seminary",
    "code": "ABS",
    "created_at": "2026-09-04T11:50:58.455206+00:00"
  },
  {
    "id": "4bb6613f-8872-4a02-aa10-441fbb27b8eb",
    "name": "Amazing Grace Biblical Seminary",
    "code": "AGBS",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "25c98ea2-7427-4876-b31e-c0a6d66545d2",
    "name": "Amazing Grace Theological Seminary",
    "code": "AGTS",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "908ea240-2e4d-41c1-8484-a37a642095f4",
    "name": "Anderson Theological College",
    "code": "ATC",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "19af1073-7186-4b64-a5e4-696352065e63",
    "name": "Andhra Bible College",
    "code": "ABC",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "6c80d34e-6fa6-4f17-a84b-c08d5c742b8e",
    "name": "Andhra Christian Theological College",
    "code": "ACTC",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "48a97680-3318-4d7b-a835-2eaf4477637a",
    "name": "Andhra Pradesh Bible College",
    "code": "APBC",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "b16cd972-7c27-4ba0-a082-5d34d494dfeb",
    "name": "Antioch Biblical Seminary and College",
    "code": "ABSC",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "3279b032-ef6d-483e-b4ba-a49bdabd8948",
    "name": "Antioch Center for Theological Studies",
    "code": "ACTS",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "daa84459-e08a-4ad5-abc1-dc770589c2f2",
    "name": "Aroma Bible College",
    "code": "ABC-2",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "6b625014-886a-4a7c-8cc2-ae9629cf00d8",
    "name": "Arunachal Theological college",
    "code": "ATC-2",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "aba0b825-5b55-496a-9910-328a1f85982a",
    "name": "Asia Antioch Seminary",
    "code": "AAS",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "ef0200dc-50e5-4e93-917c-ed853a7019e1",
    "name": "Asia Evangelical College & Seminary",
    "code": "AECS",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "1ad127e2-c0d1-428c-9e21-0c23fb0faddb",
    "name": "Asia Graduate School of Theology - North East India (AGST-NEI)",
    "code": "AGST-NEI-ALT",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "d5cd3e5f-2113-4fd7-a962-777cbb3aa9f2",
    "name": "Asia Graduate School of Theology-North East India",
    "code": "AGST-NEI",
    "created_at": "2026-09-06T07:32:35.963488+00:00"
  },
  {
    "id": "a39d1cd1-d02c-449f-846d-81568cd41d16",
    "name": "Asia Theological Association India XML master data",
    "code": "ATA",
    "created_at": "2026-09-06T07:32:37.074775+00:00"
  },
  {
    "id": "946ce0c1-c96b-4896-976d-e9f60c8b52ff",
    "name": "Asian Bible College",
    "code": "ABC-3",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "59d8cf7f-8eba-4c07-bdc0-2a5685fa639b",
    "name": "Asian Christian College of Theology",
    "code": "ACCT",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "21a3af7d-6cfb-48ed-9a43-bab068d2854f",
    "name": "Baptist Bible College & Seminary",
    "code": "BBCS",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "99fa82c4-c341-45aa-acc0-43079dfc5a90",
    "name": "Baptist Seminary of South India",
    "code": "BSSI",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "3aa4a79b-37c9-4213-800c-d1d7e00a634b",
    "name": "Baptist Theological College & Seminary",
    "code": "BTCS",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "114c6e16-8d32-49f6-bd59-4ef9f6f45e83",
    "name": "Berachah Institute of Higher Education and Research",
    "code": "BIHER",
    "created_at": "2026-09-06T08:23:01.496096+00:00"
  },
  {
    "id": "2167370f-bb71-4612-921e-e6f915963e8a",
    "name": "Berean Baptist Bible College & Seminary",
    "code": "BBBCS",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "ec350201-0e51-4820-9159-304f2b5fd47e",
    "name": "Bethel New Life College",
    "code": "BNLC",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "9c3e14f0-436d-4b14-8be1-8722abf187ce",
    "name": "Bethesda Biblical Seminary",
    "code": "BBS",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "dde0c501-1825-4e88-a28b-4056ea6be479",
    "name": "Biblical Theological College & Seminary",
    "code": "BTCS-2",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "25c1ecf7-4043-492e-b34c-d7d9c070be38",
    "name": "Brethren Bible Institute",
    "code": "BBI",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "24c4be67-91c5-41ef-8416-9be4f44d0528",
    "name": "Buntain Theological College",
    "code": "BTC",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "f5a5a18f-a456-4a9c-8317-2d208a46bd96",
    "name": "Calcutta Bible College",
    "code": "CBC",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "b4b3e611-b936-4e7d-a12e-75dae7032126",
    "name": "Calcutta Bible Seminary",
    "code": "CBS",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "ca4b5c1e-d78d-41ee-93c0-08a225799dc0",
    "name": "Caleb Institute",
    "code": "CI",
    "created_at": "2026-09-06T07:32:36.078504+00:00"
  },
  {
    "id": "afeb5697-a9cf-44fb-9886-93fd888cc670",
    "name": "Calvin Theological College & Seminary",
    "code": "CTCS",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "598eaf18-4ed2-4955-a74a-d0f9d27fbb94",
    "name": "Carmel Bible College",
    "code": "CBC-2",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "d0c5d261-fd46-4dda-ac83-e63c91cf3120",
    "name": "Central India Theological Seminary",
    "code": "CITS",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "40d3ab25-f7e3-40e9-a8e6-5360bbe0ee57",
    "name": "Centre for Global Leadership Development (SABC & GSOL)",
    "code": "CLGD",
    "created_at": "2026-09-04T11:50:56.896841+00:00"
  },
  {
    "id": "c3d0a91b-9fc3-45e7-bd9e-5fbfb072ae6a",
    "name": "Chil Chil Baptist College & Seminary",
    "code": "CCBCS",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "7ff26e74-7671-47be-adb0-8b8aa38d7ccf",
    "name": "Christ Commission Discipleship Institute",
    "code": "CCDI",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "a4971054-179d-4ea5-af79-5f3c12017781",
    "name": "Christ for the Nations Bible College",
    "code": "CNBC",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "8d27e2a5-6335-42c6-b0aa-e301f435637c",
    "name": "Christian Academy for Advanced Theological Studies",
    "code": "CAATS",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "731886fd-9a90-4763-bdab-b3827d8d10d4",
    "name": "Christian Leadership Development Centre",
    "code": "CLDC",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "9f28e739-d517-4e3c-9721-51b004dd5a88",
    "name": "Christian Renewal Theological Seminary",
    "code": "CRTS",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "9220ad6c-7bd3-4717-8e45-73bc79cda7c7",
    "name": "Church On The Rock Theological Seminary",
    "code": "COTR-TS",
    "created_at": "2026-09-06T07:32:36.359468+00:00"
  },
  {
    "id": "43cbf69e-54af-4d27-af95-4453001fe39f",
    "name": "City to City India Trust",
    "code": "CTCIT",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "2f8de99a-2d9a-476a-9242-c56d4249e078",
    "name": "Clark Theological College",
    "code": "CTC",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "e5e50959-4de6-4267-897c-fa47cc802a04",
    "name": "Compel Outreach Bible College",
    "code": "COBC",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "57386054-c4e5-41b4-93b2-02e4128aae50",
    "name": "Cornerstone Bible College & Training Centre",
    "code": "CBCTC",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "7193f1e1-918d-4f42-9a89-82b72e95d121",
    "name": "Covenant Institute of Theology and Mission",
    "code": "CITM",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "bf458529-3e97-4f27-8a6e-ccc700b0569a",
    "name": "Covenant International Bible College",
    "code": "CIBC",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "90d1929d-c546-4489-93bb-d5f243cfd244",
    "name": "Delhi Bible Institute",
    "code": "DBI",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "ed8f7955-226f-436f-9ff6-104ff14a65df",
    "name": "Discipleship Bible College",
    "code": "DBC",
    "created_at": "2026-09-04T11:51:02.246632+00:00"
  },
  {
    "id": "19563227-22fb-40b5-856e-73669b656973",
    "name": "Discipleship Theological Seminary",
    "code": "DTS",
    "created_at": "2026-09-06T08:23:01.556299+00:00"
  },
  {
    "id": "11666a34-9306-4f3b-b4c2-abdd7aa80386",
    "name": "Dobam Theological College",
    "code": "DTC-2",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "00573226-b30f-4de1-80bf-bbddae3efa89",
    "name": "Doon Bible College",
    "code": "DBC-2",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "d53152be-40c7-49f1-88fa-454aacded00b",
    "name": "Doulos Bible Institute",
    "code": "DBI-2",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "5fb1df8a-105f-4bdb-909c-cc43616166bb",
    "name": "Doulos Theological College",
    "code": "DTC",
    "created_at": "2026-09-06T07:32:36.727216+00:00"
  },
  {
    "id": "311debf9-6be8-4f41-aa28-2338f8c499e5",
    "name": "Eastern Bible College",
    "code": "EBC",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "3d4f6d8f-e52b-42b4-82f8-35762563419c",
    "name": "Eastern Theological College",
    "code": "ETC",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "ee3a57c6-7129-4aaf-9d8f-6f2a1a729508",
    "name": "Eastern Theological Institute & Seminary",
    "code": "ETIS",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "a70b1b11-243b-4a80-b46e-9cfe1d8b62af",
    "name": "Ebenezer Bible College",
    "code": "EBC-2",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "709ae97a-d111-4070-84be-bfb27929f1e4",
    "name": "Ebenezer Theological Seminary",
    "code": "ETS-2",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "49cd91ef-f3a9-4f45-994b-ac5c95b0fa95",
    "name": "Ecclesia Theological College & Seminary",
    "code": "ETCS",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "57782fad-f432-44d9-9741-19042f102bb3",
    "name": "Evangelical College of Theology",
    "code": "ECT",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "79a71fb9-4700-46d7-a0af-224a9f383fec",
    "name": "Evangelical Theological Seminary",
    "code": "ETS",
    "created_at": "2026-09-06T07:32:36.243061+00:00"
  },
  {
    "id": "7c3941a7-f791-40fa-955d-5317f8a01c57",
    "name": "Faith Baptist Bible College & Seminary",
    "code": "FBBCS",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "e324a050-a5dd-45f3-977d-5309425812dc",
    "name": "Faith Theological Seminary",
    "code": "FTS",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "32e026a3-839f-4f60-bb6b-d478b8114e3e",
    "name": "Federated Theology Program of North East India (FTP – NEI)",
    "code": "FTP-NEI",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "0e7567d2-df4c-4fe1-9ae8-c86e9ed70a51",
    "name": "Filadelfia Institute of Global Studies (FIGS)",
    "code": "FIGS",
    "created_at": "2026-09-04T11:51:01.225298+00:00"
  },
  {
    "id": "74eaea5c-2f22-4eee-ba08-6cf3fda27d85",
    "name": "Focus India Theological College",
    "code": "FITC",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "7dc68704-0acf-4457-a2a5-73c113db24dd",
    "name": "Full Gospel Bible College",
    "code": "FGBC",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "8c239a49-49e8-49d9-af3b-766a8c48fac2",
    "name": "Global Leadership Training Centre",
    "code": "GLTC",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "2c59d888-0ad9-4918-8a3b-c34c347dcab6",
    "name": "Golden Crown Theological College",
    "code": "GCTC",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "c0cf6cac-5496-4195-9a2a-4137c191fadd",
    "name": "Grace Bible College",
    "code": "GBC",
    "created_at": "2026-09-06T07:32:36.628859+00:00"
  },
  {
    "id": "09db8ce3-874a-488c-991a-a3704d459461",
    "name": "Great Harvest Theological Institute",
    "code": "GHTI",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "059f2212-305a-4713-80f9-34a412c07789",
    "name": "Green Pastures Theological Centre",
    "code": "GPTC",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "fb253034-62ac-4934-8896-c8d823230f5f",
    "name": "Harvest Bible",
    "code": "HB",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "b9ef8bbd-36dd-4051-a3af-9ae07c0265cb",
    "name": "Harvest Bible College",
    "code": "HBC",
    "created_at": "2026-09-06T07:32:36.52893+00:00"
  },
  {
    "id": "5807a91b-d6b2-4fcb-ba6b-9c9b5358bd2b",
    "name": "Harvest Mission Bible College",
    "code": "HMBC",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "67950951-4f4c-4731-bf22-df2f5f95c82c",
    "name": "Harvest Mission College",
    "code": "HMC",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "0c96c435-c2cd-4a9b-a879-6e519939ac97",
    "name": "Harvesters Theological College & Seminary",
    "code": "HTCS",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "6848e210-212a-46e0-ba33-ac8b9b4b4fb8",
    "name": "Hebron Gospel Theological College & Seminary",
    "code": "HGTCS",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "c1cf3e6c-7620-450f-95a4-b41b73c3ee45",
    "name": "Heritage Baptist Bible College & Seminary",
    "code": "HBBCS",
    "created_at": "2026-09-06T08:23:01.664312+00:00"
  },
  {
    "id": "0363166f-efd4-4472-92a1-14c33c14d13f",
    "name": "Himalayan Institute of Leadership Training",
    "code": "HILT",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "a6e92ed6-44d3-432f-a732-6a9a3d6db08f",
    "name": "Hindustan Bible Institute & College",
    "code": "HBIC",
    "created_at": "2026-09-04T11:50:59.634845+00:00"
  },
  {
    "id": "81cac099-ad34-4df8-b7b0-3c05965f43d0",
    "name": "Huldah Buntain Theological College",
    "code": "HBTC",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "3db5b5ae-021e-4552-93ae-94cf8035ee12",
    "name": "Hyderabad Bible College",
    "code": "HBC-2",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "6b5edf41-6d50-449b-ab5d-fd602adbdee0",
    "name": "Hyderabad Institute of Theology and Apologetics",
    "code": "HITA",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "bb188a76-12e3-45d2-84e8-e910bd805227",
    "name": "Ichthoos Bible College",
    "code": "IBC",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "fd2d8a93-5cbc-4930-87e9-86daefedd7b6",
    "name": "Immanuel Theological Seminary",
    "code": "ITS",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "7ff0a5c3-3a8a-46f1-b97b-d0870ea3d205",
    "name": "India Baptist Theological Seminary",
    "code": "IBTS",
    "created_at": "2026-09-06T07:32:36.016577+00:00"
  },
  {
    "id": "e06084c9-a7ba-4a2d-bdb1-5437c059e6bc",
    "name": "India Bible College & Seminary",
    "code": "IBCS",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "15df012d-1b44-4062-9e34-320f2ab21b7b",
    "name": "India Centre for Leadership",
    "code": "ICL",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "71e79887-b8ff-4592-8666-e4f60e98d1c2",
    "name": "India Christian Bible College",
    "code": "ICBC",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "9c594bc4-55e4-41a2-bb67-a7926b69a036",
    "name": "India Full Gospel Bible College",
    "code": "IFGBC",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "826a025d-fd53-4682-809f-36573513389a",
    "name": "India Graduate School of Missiology",
    "code": "IGSM",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "f7e9251e-90e8-41cc-ae00-319611f9a3f9",
    "name": "India St. Thomas Bible College & Seminary",
    "code": "ISTBCS",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "9a2333d6-5447-4a8a-a2a9-8f2cea9e6a2d",
    "name": "Institute for Biblical Studies",
    "code": "IBS",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "d7eaaa71-789d-44c1-94a1-d501bfabd382",
    "name": "IPC Theological Seminary",
    "code": "IPC-TS",
    "created_at": "2026-09-06T07:32:36.299387+00:00"
  },
  {
    "id": "aee3ae63-2e92-490c-8502-cf908bb68b40",
    "name": "John's Leadership Institute",
    "code": "JSLI",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "ea4171b3-9909-4860-939a-872cee2861da",
    "name": "John’s Leadership Institute",
    "code": "JLI",
    "created_at": "2026-09-06T07:32:36.828894+00:00"
  },
  {
    "id": "cb0f3b3b-1721-403b-8f6c-95ea64891916",
    "name": "Jubilee Memorial Bible College",
    "code": "JMBC",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "d9ff12ae-b12e-4e53-b97d-d1c2e01d1e39",
    "name": "Karnataka Bible College",
    "code": "KBC",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "2ae5ff8f-a61b-4639-9a41-ca1674a6dfa4",
    "name": "Karunya Academy for Theological Education (KATE)",
    "code": "KATE",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "6c62409a-cb39-4311-ab61-03097866e700",
    "name": "Kerala Baptist Bible College & Seminary",
    "code": "KBBCS",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "b42ad9b4-d6c2-44f6-91c9-5ece35d4c89a",
    "name": "Kerala Christian Theological Seminary",
    "code": "KCTS",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "b68f9aa6-f40a-4c1f-b03e-8a7454bb352e",
    "name": "Kihoto Theological College",
    "code": "KTC",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "aedd2db8-ede9-4a4b-9cd4-8e72e7415595",
    "name": "Kor-In Theological College & Seminary",
    "code": "KTCS",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "c099a593-bd8b-48dd-9023-c61b3c741804",
    "name": "Lakeview Bible College and Seminary",
    "code": "LBCS",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "96f82141-7521-4239-aed8-6687f210e382",
    "name": "Lamb's Institute of Field Evangelism",
    "code": "LSIFE-2",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "ede9b711-cbbb-4814-9708-9853a56e8e4e",
    "name": "Lamb’s Institute of Field Evangelism",
    "code": "LSIFE",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "a2195a1f-f657-45d6-8329-24ed2bad91fd",
    "name": "Leadership Theological College International",
    "code": "LTCI-2",
    "created_at": "2026-09-06T08:23:01.764126+00:00"
  },
  {
    "id": "d7d61f26-d629-4f38-9e69-50b8de339bc5",
    "name": "Life Theological Seminary",
    "code": "LTS",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "9f6fca50-4296-41a1-9a8c-f747f828b06c",
    "name": "Life Transforming College International",
    "code": "LTCI",
    "created_at": "2026-09-06T07:32:36.925205+00:00"
  },
  {
    "id": "25032c4f-823c-4061-886a-c9e683a6843f",
    "name": "Living Bible College",
    "code": "LBC",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "108c9a64-c084-4e68-baa0-0950d7ba7f45",
    "name": "Living Hope Theological Seminary",
    "code": "LHTS",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "3306d41d-e85b-42ec-87db-8816256f19e9",
    "name": "Logos College",
    "code": "LC",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "b0c66584-63d4-473a-832b-695145fdb18a",
    "name": "Logos College of Advanced Studies",
    "code": "LCAS",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "4cbd543e-1a7a-4902-9841-9c15d7f807e4",
    "name": "Madras AG Bible College",
    "code": "MAGBC",
    "created_at": "2026-09-06T07:32:36.478369+00:00"
  },
  {
    "id": "1db979f2-feaa-429a-b228-d304c1cf01c9",
    "name": "Madras Assemblies of God Bible College",
    "code": "MAGBC-2",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "9ed89f8b-d1df-4093-953e-661525822381",
    "name": "Madras Theological Seminary & College",
    "code": "MTSC",
    "created_at": "2026-09-06T07:32:35.896655+00:00"
  },
  {
    "id": "bf13b866-f69f-4f82-b081-e230daba4a89",
    "name": "Maharastra Bible college",
    "code": "MBC",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "8140c356-6263-4335-b23c-613feab92b2d",
    "name": "Mahima Bible Institute",
    "code": "MBI",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "c21fed51-e4be-4a98-bf97-a30b0a112418",
    "name": "Manna Bible College",
    "code": "MBC-2",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "26652d43-958f-4830-ad63-ebb7da83a179",
    "name": "Maranatha Biblical Seminary",
    "code": "MBS",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "c6cec816-6e6a-4139-a365-548d90d5c3f0",
    "name": "Maranatha Theological Seminary",
    "code": "MTS",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "a5a3ca55-6221-4f00-9f95-3f3d8ba6cd1e",
    "name": "Maranatha Veda Patasala",
    "code": "MVP",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "25a85534-0a9f-40bb-a005-bcc51b905476",
    "name": "Mission India Bible college",
    "code": "MIBC",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "23f3dd60-ea7b-40bd-950f-099262d120d2",
    "name": "Mission India Theological Seminary",
    "code": "MITS",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "1e6922df-e7d6-4c21-82d4-3bbceea661bd",
    "name": "Mizoram Bible College",
    "code": "MBC-3",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "bb34435c-6b36-48ae-9d43-10652dba180f",
    "name": "Mt Terogvu Theological College",
    "code": "MTTC-ALT",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "0310a75b-03ff-4b9b-a613-11042d16e080",
    "name": "Mt. Terogvu Theological College",
    "code": "MTTC",
    "created_at": "2026-09-06T07:32:36.578954+00:00"
  },
  {
    "id": "cca4a523-d654-4615-bda7-30470e967031",
    "name": "Mt. Zion Bible Seminary",
    "code": "MZBS",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "22195a39-0049-4559-a65d-789b28fd7ca1",
    "name": "Nagaland Baptist College",
    "code": "NBC-2",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "d6abb3b6-7987-4276-b1f2-49c1bb606e38",
    "name": "Nagaland Bible College",
    "code": "NBC",
    "created_at": "2026-09-06T07:32:36.674097+00:00"
  },
  {
    "id": "6e29a8f0-834a-4075-9e5c-aa722fe8bd1e",
    "name": "Native Evangelical School of Theology",
    "code": "NEST",
    "created_at": "2026-09-06T07:32:36.778716+00:00"
  },
  {
    "id": "e262ace9-1700-4d6b-ba16-f4966db8866b",
    "name": "Nav Bharat Bible Institute",
    "code": "NBBI",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "dd73844e-1533-43ed-a610-0a8df339dd06",
    "name": "Navin Doman Theological College",
    "code": "NDTC",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "983cb995-4461-4068-96c0-6482a5f38d56",
    "name": "New Creation Theological Academy",
    "code": "NCTA",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "6e705746-5864-4939-8af4-6904639d38dc",
    "name": "New Hope Bible College",
    "code": "NHBC",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "6e531c2f-78a9-44b3-9905-661a98f302b8",
    "name": "New India Bible Seminary",
    "code": "NIBS",
    "created_at": "2026-09-03T20:08:11.840043+00:00"
  },
  {
    "id": "315db95d-f8ac-46c6-991e-6ee3102904a8",
    "name": "New life Bible College",
    "code": "NLBC",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "1d8867a4-61f9-47fb-a841-3584e5d05acb",
    "name": "New Life Biblical Seminary",
    "code": "NLBS",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "f166a052-db20-4f62-b9de-f3d0c1883d18",
    "name": "New Life College",
    "code": "NLC",
    "created_at": "2026-09-06T07:32:36.188605+00:00"
  },
  {
    "id": "59b8b6b9-ca9e-4a23-b96b-fc3dc799b759",
    "name": "New Life School of Mission",
    "code": "NLSM",
    "created_at": "2026-09-06T08:23:01.868957+00:00"
  },
  {
    "id": "5d205b2f-dddd-4219-8c03-72f43c3a5851",
    "name": "New Theological College",
    "code": "NTC",
    "created_at": "2026-09-06T07:32:36.128502+00:00"
  },
  {
    "id": "eebe40cc-bec1-4cbc-a64d-89d98ce54bcb",
    "name": "Ngulhao Theological Seminary",
    "code": "NTS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "12cac19b-27d2-4c5d-9748-d580beaafe14",
    "name": "Nichols-Roy Bible College",
    "code": "NRBC",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "83092e06-4aff-4b5e-973c-0b4e396b7dcf",
    "name": "Nito Theological College",
    "code": "NTC-2",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "76a96790-78c5-44da-933e-50be57250a77",
    "name": "North East India Baptist Bible College & Seminary",
    "code": "NEIBBCS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "6c4508a2-d697-4f2d-a9e9-49141ba6461c",
    "name": "North East Theological Seminary",
    "code": "NETS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "b463bbe2-ff00-4dd8-85d4-8ca0dc85bef3",
    "name": "North India College of Christian Studies",
    "code": "NICCS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "8502b8b1-4f3e-4bb5-a475-918131d05c66",
    "name": "North India Institute of Theological Studies",
    "code": "NIITS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "be8b4ef2-cd2a-48b0-8a6e-d9f6d766d7d5",
    "name": "Oriental Theological College",
    "code": "OTC",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "d5373aef-f2a5-4d75-8dc2-6614af031948",
    "name": "Oriental Theological Seminary",
    "code": "OTS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "50b9645d-3f47-4acc-ab23-4a250d8ad46c",
    "name": "Peniel Bible Seminary",
    "code": "PBS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "a5f3b74f-06ba-4ea2-9f6a-b4b9e53e5d90",
    "name": "Presbyterian Theological Seminary",
    "code": "PTS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "41c902a1-6bca-4747-ae12-6a872661c6fc",
    "name": "Punjab Bible College",
    "code": "PBC",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "ed157768-3b97-422e-99cd-a673d9d7144c",
    "name": "Reachout Theological Seminary",
    "code": "RTS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "39359eb6-068c-4433-a335-5f5ecf1f6cf6",
    "name": "Rehoboth Theological Institute",
    "code": "RTI",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "271f7a6c-e502-4599-9f83-ce1f514fae79",
    "name": "Restoration Theological College",
    "code": "RTC",
    "created_at": "2026-09-06T07:32:36.974101+00:00"
  },
  {
    "id": "bba37cdc-3b68-46ae-a873-4f0c47740dd8",
    "name": "Rhema Bible College and Seminary",
    "code": "RBCS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "b30c285a-b239-4904-b826-da48aa2445a2",
    "name": "Rhema Revival Bible College",
    "code": "RRBC",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "9c23b5d9-d548-49ad-9277-912307df1ea2",
    "name": "Sathya Veda Seminary",
    "code": "SVS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "4b090754-1da4-4f94-b2f0-41413af87c68",
    "name": "SATYA VACHAN SEMINARY",
    "code": "SVS-2",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "e17dd317-0cf7-450a-8e7d-23640336f128",
    "name": "Servanthood Bible College",
    "code": "SBC",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "51fd082d-6553-445c-b046-3aeb62afada9",
    "name": "Shalom Bible College",
    "code": "SBC-2",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "e93c5269-99ae-44c4-8653-ee7c2fb93b7f",
    "name": "Shalom Bible Seminary",
    "code": "SBS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "920c8f24-1334-47e1-97d9-fa9dde68905b",
    "name": "Sharon Bible College",
    "code": "SBC-3",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "0da6a28d-2685-40ad-9d5a-2bf475b97a11",
    "name": "Shiloh Baptist Bible College & Seminary",
    "code": "SBBCS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "479f8e8f-37b4-40cd-9de5-b7f4406f38d9",
    "name": "Sielmat Bible College",
    "code": "SBC-4",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "32de4338-962a-4b12-ba2d-4e2dc2dcb7da",
    "name": "South Asia Institute of Advanced Christian Studies",
    "code": "SAIACS",
    "created_at": "2026-09-04T11:50:52.75504+00:00"
  },
  {
    "id": "d5858653-6f38-4c4b-9ffd-3f3f41f0502c",
    "name": "South Asia Institute of Advanced Christian Studies (SAIACS)",
    "code": "SAIACSS",
    "created_at": "2026-09-06T08:23:01.968143+00:00"
  },
  {
    "id": "3193ba52-af80-4feb-86af-93679fdf9ee2",
    "name": "South Asia Leadership Training and Development Centre, (SALT-DC)",
    "code": "SALT-DC",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "725c9153-228c-4d84-8f73-4b5303dc9f2d",
    "name": "South Asia Nazarene Bible College",
    "code": "SANBC",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "915ea6a5-58cc-4d0b-bbf0-ea5d51d24d26",
    "name": "South Asia Theological College and Seminary",
    "code": "SATCS",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "e8e58745-f8bd-4641-b4ec-39e03a84a874",
    "name": "South Asian Institute for Leadership and Cultural Studies (SAILCS)",
    "code": "SAILCS",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "5da8e6d7-88ca-4b89-9260-4ff36aa13b5c",
    "name": "South India Baptist Bible College & Seminary",
    "code": "SIBBC",
    "created_at": "2026-09-06T07:32:37.024243+00:00"
  },
  {
    "id": "55a01038-ae9d-444b-8338-7a8a1cd1402a",
    "name": "South India Bible Seminary, (SIBS)",
    "code": "SIBS",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "104f548c-cf3e-49c3-88ab-4d513617c658",
    "name": "Southern Asia Leadership Institute",
    "code": "SALI",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "5713612b-1e7b-4b32-8359-ac21759f8d82",
    "name": "Southern Bible College",
    "code": "SBC-5",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "77f3f609-956d-4b68-baa9-b86175e4f2f0",
    "name": "St. Ignatius Theological Seminary",
    "code": "SITS",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "c690810d-a48b-4ea0-8276-87e1ff3fc723",
    "name": "Susamachar Theological College & Seminary - Copy",
    "code": "STCSC",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "8760e61b-5b9a-495a-bdec-b0e96047bb08",
    "name": "Susamachar Theological College and Seminary",
    "code": "STCS",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "b6567277-5a48-447b-9c1b-c519a50abe67",
    "name": "The Salvation Army Human Resource Development Department in India",
    "code": "SAHRDDI",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "c6a6760e-3e66-40bd-9dd6-a43e8563f867",
    "name": "The Word for The World International",
    "code": "WWI",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "8283dd4d-71ce-4791-b085-708bcf14cbde",
    "name": "Trinity Bible College",
    "code": "TBC",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "e9856b9f-1fa0-4d32-98ee-80e6e7919c81",
    "name": "Trinity Christian College",
    "code": "TCC",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "e7edd804-ed3b-4932-a689-36e0b36f5ca0",
    "name": "Trinity College and Seminary",
    "code": "TCS",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "5ae28fcf-553c-4caa-9766-06ba79bf5cf7",
    "name": "Trinity Theological College",
    "code": "TTC",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "8d357cff-e747-47bd-8560-f62564fc11ad",
    "name": "Trivandrum Biblical Seminary",
    "code": "TBS",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "d4c05df7-6839-452b-9437-91483f742bdf",
    "name": "True Light for Asia Biblical Seminary",
    "code": "TLABS",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "9b529322-eb5c-4ca6-809b-872a8da35210",
    "name": "UIM-Family Research Training Institute (UIM-FRTI)",
    "code": "UIM-FRTI",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "8dcc7eac-69df-4cd1-b687-65fe76f14b97",
    "name": "Union Biblical Seminary",
    "code": "UBS",
    "created_at": "2026-09-04T11:50:55.150789+00:00"
  },
  {
    "id": "0a7d26e5-30ac-41d6-b645-c55fd2d8b1f2",
    "name": "United College of Theology & Missions",
    "code": "UCTM",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "57d678b7-6923-464b-9708-5697671f306c",
    "name": "Universal Institute of Truth",
    "code": "UIT",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "ecfd68ad-a186-4451-ada7-43ce2099360f",
    "name": "Vellore Bible College",
    "code": "VBC",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "d953d61e-c47b-4d2b-a26b-d22f04e4ab85",
    "name": "Vision Theological Seminary",
    "code": "VTS",
    "created_at": "2026-09-06T07:32:36.877979+00:00"
  },
  {
    "id": "22e15ed9-27c0-4196-89d5-a5d7bd0bbc98",
    "name": "Witter Bible College",
    "code": "WBC",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  },
  {
    "id": "bbfd001e-3f9d-492a-ae76-f48f623d262d",
    "name": "Zion Bible College",
    "code": "ZBC",
    "created_at": "2026-09-06T08:23:02.072131+00:00"
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    "id": "08b1dfaf-469d-47d1-b093-2b9614af6cf5",
    "institution_id": "a39d1cd1-d02c-449f-846d-81568cd41d16",
    "name": "Accredited Academic Programs",
    "code": "ACAD",
    "created_at": "2026-09-06T07:32:38.918319+00:00"
  },
  {
    "id": "26cd4680-5513-403a-8433-6b43e93ebd86",
    "institution_id": "6e531c2f-78a9-44b3-9905-661a98f302b8",
    "name": "Biblical Studies",
    "code": "BIBL",
    "created_at": "2026-09-04T11:50:51.833914+00:00"
  },
  {
    "id": "bef81bdd-c95e-4098-a8c9-cfcf0df05cc6",
    "institution_id": "32de4338-962a-4b12-ba2d-4e2dc2dcb7da",
    "name": "Biblical Studies",
    "code": "BIBL",
    "created_at": "2026-09-04T11:50:52.935396+00:00"
  },
  {
    "id": "53c57571-42d4-441a-bb45-d950350baa9c",
    "institution_id": "a6e92ed6-44d3-432f-a732-6a9a3d6db08f",
    "name": "Christian Education",
    "code": "CED",
    "created_at": "2026-09-04T11:51:00.834277+00:00"
  },
  {
    "id": "75f82a06-1e54-4373-b193-29506ad07a2e",
    "institution_id": "0e7567d2-df4c-4fe1-9ae8-c86e9ed70a51",
    "name": "Christian Leadership",
    "code": "LEAD",
    "created_at": "2026-09-04T11:51:01.90537+00:00"
  },
  {
    "id": "c194289e-7457-484b-89ee-a0b2ec399d23",
    "institution_id": "40d3ab25-f7e3-40e9-a8e6-5360bbe0ee57",
    "name": "Christian Leadership & Education",
    "code": "CLE",
    "created_at": "2026-09-04T11:50:57.595586+00:00"
  },
  {
    "id": "b3f4246f-a84c-491d-90a9-54fb3d55b07e",
    "institution_id": "32de4338-962a-4b12-ba2d-4e2dc2dcb7da",
    "name": "Christian Leadership & Ministry",
    "code": "MIN",
    "created_at": "2026-09-06T07:32:37.173468+00:00"
  },
  {
    "id": "3c6fde2c-c7f3-4f1c-b41d-f91730a5668f",
    "institution_id": "50a48f4a-7142-4462-97ab-bc06aaf0036b",
    "name": "Christian Ministry",
    "code": "CMIN",
    "created_at": "2026-09-04T11:50:59.127481+00:00"
  },
  {
    "id": "be7351f5-40f0-46ff-8181-c7ca61693930",
    "institution_id": "8dcc7eac-69df-4cd1-b687-65fe76f14b97",
    "name": "Christian Ministry & Leadership",
    "code": "CMIN",
    "created_at": "2026-09-04T11:50:55.998885+00:00"
  },
  {
    "id": "0c743554-2d28-4738-a7db-388b3a4a05a1",
    "institution_id": "bbfd001e-3f9d-492a-ae76-f48f623d262d",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "3ec7f283-6ed1-4e17-8729-7dcefb85aac6",
    "institution_id": "59b8b6b9-ca9e-4a23-b96b-fc3dc799b759",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "f3821d2b-c012-409b-b288-b7b815bd0ce6",
    "institution_id": "eebe40cc-bec1-4cbc-a64d-89d98ce54bcb",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "459f14de-a6e7-41d2-8f6a-a1e305e37693",
    "institution_id": "12cac19b-27d2-4c5d-9748-d580beaafe14",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "55e70d0b-5403-4fc5-ac13-eb98f1f87801",
    "institution_id": "83092e06-4aff-4b5e-973c-0b4e396b7dcf",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "5580330b-5fa3-47d8-84c1-8cf589e410bf",
    "institution_id": "76a96790-78c5-44da-933e-50be57250a77",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "652a6d57-53cc-4adf-ad5a-5dd1d7a2d271",
    "institution_id": "6c4508a2-d697-4f2d-a9e9-49141ba6461c",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "4687cef7-544f-488c-8976-300fb0a5f67e",
    "institution_id": "b463bbe2-ff00-4dd8-85d4-8ca0dc85bef3",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "66510648-c56a-4c36-9af6-0e0865ad325f",
    "institution_id": "8502b8b1-4f3e-4bb5-a475-918131d05c66",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "97d961bb-3a22-4d55-a813-f08d09e283b6",
    "institution_id": "be8b4ef2-cd2a-48b0-8a6e-d9f6d766d7d5",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "5315f616-77e2-4abd-9e8c-b4b371765646",
    "institution_id": "d5373aef-f2a5-4d75-8dc2-6614af031948",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "2dde32a0-2677-405e-a63b-4c6894b1248a",
    "institution_id": "50b9645d-3f47-4acc-ab23-4a250d8ad46c",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "e6dd8d2a-36a0-49e7-bd0d-c233f65f9582",
    "institution_id": "a5f3b74f-06ba-4ea2-9f6a-b4b9e53e5d90",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "4f62d074-d58b-4125-9c47-b5fbf8e6b335",
    "institution_id": "41c902a1-6bca-4747-ae12-6a872661c6fc",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "1cc2b5e9-e15f-4767-975f-20a8881c9908",
    "institution_id": "ed157768-3b97-422e-99cd-a673d9d7144c",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "b536f10e-ed19-47f4-a6a7-b19d39736715",
    "institution_id": "39359eb6-068c-4433-a335-5f5ecf1f6cf6",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "991a92fd-33f7-44be-a01e-aa9a5e8e3ac3",
    "institution_id": "bba37cdc-3b68-46ae-a873-4f0c47740dd8",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "06dde63d-8e41-4101-9d6b-170d49731afb",
    "institution_id": "b30c285a-b239-4904-b826-da48aa2445a2",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "fac957ec-8628-48af-9c4a-012bf970a1e2",
    "institution_id": "9c23b5d9-d548-49ad-9277-912307df1ea2",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "f56f5a42-b5f8-4c72-8363-032faa39600c",
    "institution_id": "4b090754-1da4-4f94-b2f0-41413af87c68",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "62a9155d-a40c-4253-9809-c243161a89b4",
    "institution_id": "e17dd317-0cf7-450a-8e7d-23640336f128",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "e77b8c4a-ec42-45dc-b513-ad33a5329d8f",
    "institution_id": "51fd082d-6553-445c-b046-3aeb62afada9",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "a80c86ea-ba91-4218-9178-2d50e472c303",
    "institution_id": "e93c5269-99ae-44c4-8653-ee7c2fb93b7f",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "9b800552-fcc7-4aca-bab9-9e9bdc1618c1",
    "institution_id": "920c8f24-1334-47e1-97d9-fa9dde68905b",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "e9f756da-9cfc-4aa2-ba75-5ae3dbeb2351",
    "institution_id": "0da6a28d-2685-40ad-9d5a-2bf475b97a11",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "22af8c34-5e5d-439c-a6fc-a088f609b125",
    "institution_id": "479f8e8f-37b4-40cd-9de5-b7f4406f38d9",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "a9c3365e-72c2-4ea9-af74-bcc17d53372a",
    "institution_id": "d5858653-6f38-4c4b-9ffd-3f3f41f0502c",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.732413+00:00"
  },
  {
    "id": "cc2c5d68-d115-440d-8d88-2fdf5c82f394",
    "institution_id": "3193ba52-af80-4feb-86af-93679fdf9ee2",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "3d87f153-54bb-4738-9910-be8668a99baa",
    "institution_id": "725c9153-228c-4d84-8f73-4b5303dc9f2d",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "c42eb7bc-31c8-4aaf-af30-be36df0e31c4",
    "institution_id": "915ea6a5-58cc-4d0b-bbf0-ea5d51d24d26",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "16fd3961-f242-4f2f-80a4-86f858421fe9",
    "institution_id": "e8e58745-f8bd-4641-b4ec-39e03a84a874",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "eabf2251-c8b2-4b40-9516-04d447cfbc77",
    "institution_id": "55a01038-ae9d-444b-8338-7a8a1cd1402a",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "2bbf45f1-6345-44c9-8bed-e87096f3bd80",
    "institution_id": "104f548c-cf3e-49c3-88ab-4d513617c658",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "eb6d4422-3aa3-4268-9071-991a22b1792f",
    "institution_id": "5713612b-1e7b-4b32-8359-ac21759f8d82",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "e01d5da2-91d2-4758-b95e-acd2b55eb8ba",
    "institution_id": "77f3f609-956d-4b68-baa9-b86175e4f2f0",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "e151fa82-1c7a-4253-9ecb-6eb0be01e843",
    "institution_id": "c690810d-a48b-4ea0-8276-87e1ff3fc723",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "5ec29532-0774-4499-ac65-3cd140968b46",
    "institution_id": "8760e61b-5b9a-495a-bdec-b0e96047bb08",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "9ae71be5-a9b8-47b8-affb-fd6f486957df",
    "institution_id": "b6567277-5a48-447b-9c1b-c519a50abe67",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "264843fa-a9cf-4864-a434-32935e4ab6f5",
    "institution_id": "c6a6760e-3e66-40bd-9dd6-a43e8563f867",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "914f3ba0-b33b-40a5-b7b2-76b2a636ba38",
    "institution_id": "8283dd4d-71ce-4791-b085-708bcf14cbde",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "341223ca-c75d-41de-9325-815dc23e79a6",
    "institution_id": "e9856b9f-1fa0-4d32-98ee-80e6e7919c81",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "c5bc5c63-e83c-4662-95d3-aa554e767a31",
    "institution_id": "e7edd804-ed3b-4932-a689-36e0b36f5ca0",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "ceeaed66-bf35-499e-9497-8cdc689444e6",
    "institution_id": "5ae28fcf-553c-4caa-9766-06ba79bf5cf7",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "514c7b18-bf75-432e-b83a-d250347f91bd",
    "institution_id": "8d357cff-e747-47bd-8560-f62564fc11ad",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "248b1121-3088-4fb0-8229-c153973ec662",
    "institution_id": "d4c05df7-6839-452b-9437-91483f742bdf",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "e22db4fe-e166-439e-a97f-751547921a04",
    "institution_id": "9b529322-eb5c-4ca6-809b-872a8da35210",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "fb949836-12d6-4a29-886c-5ddcd928fc68",
    "institution_id": "0a7d26e5-30ac-41d6-b645-c55fd2d8b1f2",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "5de50c5e-3f4d-4e28-83cb-dd4aa5a4d19a",
    "institution_id": "57d678b7-6923-464b-9708-5697671f306c",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "d3e09725-e53d-4947-8502-ba74dd836876",
    "institution_id": "ecfd68ad-a186-4451-ada7-43ce2099360f",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "8dae2c63-e0e7-461f-8e20-c278c79d4bd0",
    "institution_id": "22e15ed9-27c0-4196-89d5-a5d7bd0bbc98",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.785144+00:00"
  },
  {
    "id": "4aa3858d-a701-4745-893c-7e1a6fdb1e76",
    "institution_id": "78901240-699c-4cc0-bd40-648133a8b1a6",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "ed54e04e-b356-4bc4-98eb-01e5f9167d68",
    "institution_id": "1d9e49ea-3bab-4d7f-b834-3b93d9fc6b94",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "714de06c-b22d-4c69-b1b6-a8ba89618046",
    "institution_id": "1c647eba-d300-4542-b586-a2f704e90300",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "401df322-3ff0-417c-8132-292b6d969e72",
    "institution_id": "225234d7-6623-42db-8ac8-033a812f4b01",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "4124db1b-9d20-4bb7-99b2-935078f8c7b8",
    "institution_id": "84261bdf-bbcd-40a3-8ad4-0f589f6151a8",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "298a101d-74c7-4b09-b416-b219f51d0b15",
    "institution_id": "86dc17fa-696d-449e-bdc0-fda704ad269c",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "3fdeaa03-919b-410b-81d1-3d58b202423d",
    "institution_id": "4bb6613f-8872-4a02-aa10-441fbb27b8eb",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "9f55c64e-6eee-428d-8886-54b0ab0e1e8e",
    "institution_id": "25c98ea2-7427-4876-b31e-c0a6d66545d2",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "bf951b67-b4b7-4f9c-8f93-87de50eed8aa",
    "institution_id": "908ea240-2e4d-41c1-8484-a37a642095f4",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "1286f06b-ff2c-4a08-b224-01668f6a260d",
    "institution_id": "19af1073-7186-4b64-a5e4-696352065e63",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "f736b665-41d4-4898-b887-5b00708ca3f5",
    "institution_id": "6c80d34e-6fa6-4f17-a84b-c08d5c742b8e",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "e0e63fc4-256d-4941-9df8-d5d1e47b2714",
    "institution_id": "48a97680-3318-4d7b-a835-2eaf4477637a",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "e51ce36a-1d05-4376-91f6-ad90e437b8a7",
    "institution_id": "b16cd972-7c27-4ba0-a082-5d34d494dfeb",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "3d0fdc3e-8dd6-4536-8df3-786a622ab87e",
    "institution_id": "3279b032-ef6d-483e-b4ba-a49bdabd8948",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "b2f8e57d-04b5-418e-88f5-c7cdb6f26c4c",
    "institution_id": "daa84459-e08a-4ad5-abc1-dc770589c2f2",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "7cc69375-a30b-4c37-9d72-55b986b6f69e",
    "institution_id": "6b625014-886a-4a7c-8cc2-ae9629cf00d8",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "0bdc2bf1-1eda-416d-bc8b-919b084457e7",
    "institution_id": "aba0b825-5b55-496a-9910-328a1f85982a",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "609074a2-3402-42b1-aee1-2a6dc90b2eed",
    "institution_id": "ef0200dc-50e5-4e93-917c-ed853a7019e1",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "860acb81-c65f-4f98-aa21-49a22409d78f",
    "institution_id": "1ad127e2-c0d1-428c-9e21-0c23fb0faddb",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "4b08487b-059e-4496-8bcf-e98d728d14ca",
    "institution_id": "946ce0c1-c96b-4896-976d-e9f60c8b52ff",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "b3b039d0-2908-4a1f-b87d-be4625f4388e",
    "institution_id": "59d8cf7f-8eba-4c07-bdc0-2a5685fa639b",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "9bd047ef-b722-407a-9916-473c8e24d100",
    "institution_id": "21a3af7d-6cfb-48ed-9a43-bab068d2854f",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "e12e7010-e492-4f7a-aad2-8418dd59661f",
    "institution_id": "99fa82c4-c341-45aa-acc0-43079dfc5a90",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "667418d2-790e-47e1-b780-cea0535cee69",
    "institution_id": "3aa4a79b-37c9-4213-800c-d1d7e00a634b",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "9124b249-b5d7-454f-933b-a621b40f2e4e",
    "institution_id": "114c6e16-8d32-49f6-bd59-4ef9f6f45e83",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.377115+00:00"
  },
  {
    "id": "de4aa189-fba2-4842-b83f-3258d54a1340",
    "institution_id": "2167370f-bb71-4612-921e-e6f915963e8a",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "5c5c8c50-d06f-4d8f-aa64-512a76a1aa0f",
    "institution_id": "ec350201-0e51-4820-9159-304f2b5fd47e",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "0f98439d-4220-46bf-846b-3689b020854e",
    "institution_id": "9c3e14f0-436d-4b14-8be1-8722abf187ce",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "5c043e79-6acd-49de-af6e-00fbf67d6e34",
    "institution_id": "dde0c501-1825-4e88-a28b-4056ea6be479",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "ad833830-8b32-46ea-a9d2-3e6e5219d747",
    "institution_id": "25c1ecf7-4043-492e-b34c-d7d9c070be38",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "249c35a4-17fb-4c23-a074-e4ca7a584cfc",
    "institution_id": "24c4be67-91c5-41ef-8416-9be4f44d0528",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "d883711d-039f-49bf-981f-3c283600e697",
    "institution_id": "f5a5a18f-a456-4a9c-8317-2d208a46bd96",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "4635244f-4bab-45d0-a0a3-0a55a639f196",
    "institution_id": "b4b3e611-b936-4e7d-a12e-75dae7032126",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "f900ec42-d48a-44ef-a94b-3c9cd4c28124",
    "institution_id": "afeb5697-a9cf-44fb-9886-93fd888cc670",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "7139477e-3ca2-4878-9d8c-7c3234f29034",
    "institution_id": "598eaf18-4ed2-4955-a74a-d0f9d27fbb94",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "56ef12fa-a98c-425e-b803-f903a464af5e",
    "institution_id": "d0c5d261-fd46-4dda-ac83-e63c91cf3120",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "85eca5f4-0ac2-4e8e-839c-30b72cccbba6",
    "institution_id": "c3d0a91b-9fc3-45e7-bd9e-5fbfb072ae6a",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "cce044d7-eab4-4652-931a-c0dfaf7bb4e1",
    "institution_id": "7ff26e74-7671-47be-adb0-8b8aa38d7ccf",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "674160ce-5053-4c18-96e7-eea7dc74921a",
    "institution_id": "a4971054-179d-4ea5-af79-5f3c12017781",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "60dcb668-2945-4c36-9572-ffea17f04c65",
    "institution_id": "8d27e2a5-6335-42c6-b0aa-e301f435637c",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "858d7677-6673-472a-be88-4cd8169543e3",
    "institution_id": "731886fd-9a90-4763-bdab-b3827d8d10d4",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "3b677a48-fb0c-4cc5-a5e9-a90908454fa6",
    "institution_id": "9f28e739-d517-4e3c-9721-51b004dd5a88",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "77585fd0-508a-404b-bcb2-58c151c99fcc",
    "institution_id": "43cbf69e-54af-4d27-af95-4453001fe39f",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "6d1a561c-bd46-451b-a385-1463ce16bbb9",
    "institution_id": "2f8de99a-2d9a-476a-9242-c56d4249e078",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "6133c916-d438-4ab5-ad8c-976df1cccebe",
    "institution_id": "e5e50959-4de6-4267-897c-fa47cc802a04",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "4c59d98f-5f43-4eb9-b507-afaab1b8a12b",
    "institution_id": "57386054-c4e5-41b4-93b2-02e4128aae50",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "14cbe224-5a00-4ab8-9c40-6dd22f33a747",
    "institution_id": "7193f1e1-918d-4f42-9a89-82b72e95d121",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "33c6aaed-63c0-465f-8608-3da4df8cfc91",
    "institution_id": "bf458529-3e97-4f27-8a6e-ccc700b0569a",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "8d458a1b-c28f-40a4-9be8-84f6c2e58b11",
    "institution_id": "90d1929d-c546-4489-93bb-d5f243cfd244",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "da081e85-f648-45d1-8938-94d9b53d1190",
    "institution_id": "19563227-22fb-40b5-856e-73669b656973",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.506762+00:00"
  },
  {
    "id": "c0f77174-9c35-42b1-8e63-a95a9afae25a",
    "institution_id": "11666a34-9306-4f3b-b4c2-abdd7aa80386",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "9141d4dc-63ab-4deb-b1a3-dedb3af0da5e",
    "institution_id": "00573226-b30f-4de1-80bf-bbddae3efa89",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "3b3e5a1a-a94d-4382-b51e-18ae6096b9d3",
    "institution_id": "d53152be-40c7-49f1-88fa-454aacded00b",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "2a3fab1c-034e-45f4-bef0-60fb1c23977f",
    "institution_id": "311debf9-6be8-4f41-aa28-2338f8c499e5",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "adc7363e-7702-4616-a277-98f24576b441",
    "institution_id": "3d4f6d8f-e52b-42b4-82f8-35762563419c",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "1f9afc7a-12bf-4745-9f58-292a8d4a8a61",
    "institution_id": "ee3a57c6-7129-4aaf-9d8f-6f2a1a729508",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "39ede850-015b-4ee6-a6a4-d7f837a5c50b",
    "institution_id": "a70b1b11-243b-4a80-b46e-9cfe1d8b62af",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "5bdc8884-2445-4663-af8a-e42219f18ac7",
    "institution_id": "709ae97a-d111-4070-84be-bfb27929f1e4",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "0a3897ce-2402-4167-9ee5-ffafbe875be2",
    "institution_id": "49cd91ef-f3a9-4f45-994b-ac5c95b0fa95",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "564d9526-8f95-4238-8c9e-1f6ec7fe6a00",
    "institution_id": "57782fad-f432-44d9-9741-19042f102bb3",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "0431ce35-419e-4fc5-8ad2-643fe9b1ff30",
    "institution_id": "7c3941a7-f791-40fa-955d-5317f8a01c57",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "00f23b94-b51d-438d-b6fd-257e4ded39eb",
    "institution_id": "e324a050-a5dd-45f3-977d-5309425812dc",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "5036fee2-7f17-4e86-8297-ee4401cd976e",
    "institution_id": "32e026a3-839f-4f60-bb6b-d478b8114e3e",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "0247b6c7-bfb5-4708-8991-589427a9d5b9",
    "institution_id": "74eaea5c-2f22-4eee-ba08-6cf3fda27d85",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "e72d7705-a1a0-4ddf-af95-54aeb0e59685",
    "institution_id": "7dc68704-0acf-4457-a2a5-73c113db24dd",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "c25fd5fb-3690-4ad9-bdc1-c010b6b564da",
    "institution_id": "8c239a49-49e8-49d9-af3b-766a8c48fac2",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "9fad4dd5-55b5-440b-b59f-899a1eaa6b15",
    "institution_id": "2c59d888-0ad9-4918-8a3b-c34c347dcab6",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "95899934-1e17-4e12-b4d7-def27341fcf2",
    "institution_id": "09db8ce3-874a-488c-991a-a3704d459461",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "e6348261-d09b-45a1-8e3e-cfb4361e219b",
    "institution_id": "059f2212-305a-4713-80f9-34a412c07789",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "6df877cc-2e7a-4da1-93b2-520ed0e25816",
    "institution_id": "fb253034-62ac-4934-8896-c8d823230f5f",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "8e059ed7-1714-4d8c-8d68-d023520d988b",
    "institution_id": "5807a91b-d6b2-4fcb-ba6b-9c9b5358bd2b",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "c1200c7b-ad94-4706-ba06-e2310e2cda4a",
    "institution_id": "67950951-4f4c-4731-bf22-df2f5f95c82c",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "d1cc0cb1-d066-4262-945f-3c6b669ca9f3",
    "institution_id": "0c96c435-c2cd-4a9b-a879-6e519939ac97",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "c7eddd25-fd68-40ad-bb9a-b0f46fe891f0",
    "institution_id": "6848e210-212a-46e0-ba33-ac8b9b4b4fb8",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "7fb084bb-b3a0-41fb-8d86-8f5c03ba8ff3",
    "institution_id": "c1cf3e6c-7620-450f-95a4-b41b73c3ee45",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.55812+00:00"
  },
  {
    "id": "0c936f95-2ffe-473b-95d6-c6040308ee22",
    "institution_id": "0363166f-efd4-4472-92a1-14c33c14d13f",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "e71f8478-1368-48ee-a4e1-95ee0740acbe",
    "institution_id": "81cac099-ad34-4df8-b7b0-3c05965f43d0",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "dcf41bf0-37f7-4014-bc59-de9980c647e8",
    "institution_id": "3db5b5ae-021e-4552-93ae-94cf8035ee12",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "2c859d33-056c-4586-b662-ad4159ac78f6",
    "institution_id": "6b5edf41-6d50-449b-ab5d-fd602adbdee0",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "ae4c6a8c-d5a6-4c9d-8484-5dc41c80bf4a",
    "institution_id": "bb188a76-12e3-45d2-84e8-e910bd805227",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "7850604d-4d90-484a-8f8c-1a81058100c0",
    "institution_id": "fd2d8a93-5cbc-4930-87e9-86daefedd7b6",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "ad932cf0-e664-4495-a6f8-5e000aaf339b",
    "institution_id": "e06084c9-a7ba-4a2d-bdb1-5437c059e6bc",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "b5e5b62b-53fe-490a-8427-5bcbaef7f07e",
    "institution_id": "15df012d-1b44-4062-9e34-320f2ab21b7b",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "85527bb4-320c-4f21-8144-c38c3a89757d",
    "institution_id": "71e79887-b8ff-4592-8666-e4f60e98d1c2",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "e5f140a7-ea78-4387-aa16-7342220622c5",
    "institution_id": "9c594bc4-55e4-41a2-bb67-a7926b69a036",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "e9b3d126-b2b0-47ac-908d-3b6896122cf2",
    "institution_id": "826a025d-fd53-4682-809f-36573513389a",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "58fa2e1e-9ed6-4465-954d-aee142622ec1",
    "institution_id": "f7e9251e-90e8-41cc-ae00-319611f9a3f9",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "78b18e20-da8e-4ff0-86a2-5e9d46e113e2",
    "institution_id": "9a2333d6-5447-4a8a-a2a9-8f2cea9e6a2d",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "66b6c510-72cc-426d-8d8b-8e738d47b12d",
    "institution_id": "aee3ae63-2e92-490c-8502-cf908bb68b40",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "dca47b11-8a02-4cc0-981f-671896fc3692",
    "institution_id": "cb0f3b3b-1721-403b-8f6c-95ea64891916",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "60c3b366-a794-4ba5-ac02-f3e15be2ea4f",
    "institution_id": "d9ff12ae-b12e-4e53-b97d-d1c2e01d1e39",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "94dcf306-b0d3-4410-9b09-db7ff6c49f15",
    "institution_id": "2ae5ff8f-a61b-4639-9a41-ca1674a6dfa4",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "c49677e2-c1c4-4926-8323-120a3693fe77",
    "institution_id": "6c62409a-cb39-4311-ab61-03097866e700",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "73c3d6b4-a2f5-45f3-9d6d-01b20cd1fc7e",
    "institution_id": "b42ad9b4-d6c2-44f6-91c9-5ece35d4c89a",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "501e993b-a036-4650-adb1-a58b986a1fd7",
    "institution_id": "b68f9aa6-f40a-4c1f-b03e-8a7454bb352e",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "3cc21a46-06d0-46e3-99b2-0988a15cb1f4",
    "institution_id": "aedd2db8-ede9-4a4b-9cd4-8e72e7415595",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "50cdec84-89f3-41f5-b3c5-71a3c47e4fd2",
    "institution_id": "c099a593-bd8b-48dd-9023-c61b3c741804",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "4452e861-be19-4d8d-9952-7859ef3c38c5",
    "institution_id": "96f82141-7521-4239-aed8-6687f210e382",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "96b1fd6d-8a74-47b2-82b8-0ac1ad011acd",
    "institution_id": "ede9b711-cbbb-4814-9708-9853a56e8e4e",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "052ddb0d-d547-4e5a-8192-74bd79ab6300",
    "institution_id": "a2195a1f-f657-45d6-8329-24ed2bad91fd",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.627691+00:00"
  },
  {
    "id": "2c161351-11a7-4457-a9e5-37f517d3d444",
    "institution_id": "d7d61f26-d629-4f38-9e69-50b8de339bc5",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "8da7d80a-eca1-46fe-89d8-83c8ab92d5b3",
    "institution_id": "25032c4f-823c-4061-886a-c9e683a6843f",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "1b53c176-8300-4c5b-a8ad-0d03550c2e09",
    "institution_id": "108c9a64-c084-4e68-baa0-0950d7ba7f45",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "0fac5da9-ef57-44e8-909e-c36f485e39db",
    "institution_id": "3306d41d-e85b-42ec-87db-8816256f19e9",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "429444ad-4615-4637-ac60-e1725f225b7f",
    "institution_id": "b0c66584-63d4-473a-832b-695145fdb18a",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "436005ef-4ae4-430f-948e-38c7ab5e5b8b",
    "institution_id": "1db979f2-feaa-429a-b228-d304c1cf01c9",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "41805d2c-684c-4ae5-a5e2-32b1c1fdf898",
    "institution_id": "bf13b866-f69f-4f82-b081-e230daba4a89",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "7289d7b1-df7a-4fe7-a2ae-cd55c9bd29ce",
    "institution_id": "8140c356-6263-4335-b23c-613feab92b2d",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "c6baca87-beb6-4283-8f67-aa0236644b91",
    "institution_id": "c21fed51-e4be-4a98-bf97-a30b0a112418",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "0e0fe759-922c-4abf-9945-2e6472dce8e6",
    "institution_id": "26652d43-958f-4830-ad63-ebb7da83a179",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "a293b125-3bed-4798-a726-ce6fd633123f",
    "institution_id": "c6cec816-6e6a-4139-a365-548d90d5c3f0",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "b45d0a72-5f8c-405c-a715-8293b3b4dbf6",
    "institution_id": "a5a3ca55-6221-4f00-9f95-3f3d8ba6cd1e",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "642b6c16-d6a5-46b5-941c-f90081df78a9",
    "institution_id": "25a85534-0a9f-40bb-a005-bcc51b905476",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "ee1b294c-0bae-40b0-a5a3-46b1230517bf",
    "institution_id": "23f3dd60-ea7b-40bd-950f-099262d120d2",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "975cdfc5-3978-474c-94f1-0b29992fc0c6",
    "institution_id": "1e6922df-e7d6-4c21-82d4-3bbceea661bd",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "481b3c3b-02e4-4011-8e8b-e782dddbc19b",
    "institution_id": "bb34435c-6b36-48ae-9d43-10652dba180f",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "58578c78-38f7-441f-b71f-87e1dee7c04a",
    "institution_id": "cca4a523-d654-4615-bda7-30470e967031",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "06298975-62e0-45ea-8388-30b05e5c35eb",
    "institution_id": "22195a39-0049-4559-a65d-789b28fd7ca1",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "d8d64710-423d-4158-a054-857f4694e70d",
    "institution_id": "e262ace9-1700-4d6b-ba16-f4966db8866b",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "8c334237-e6c0-40ef-96fa-99e9064cb28d",
    "institution_id": "dd73844e-1533-43ed-a610-0a8df339dd06",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "c3d8d41f-cb6b-42d2-9026-339da5b7ffe8",
    "institution_id": "983cb995-4461-4068-96c0-6482a5f38d56",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "d3fe33ea-d836-4172-9030-0dcb5be6f573",
    "institution_id": "6e705746-5864-4939-8af4-6904639d38dc",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "2bb5fd82-e5ad-46ae-b769-3d1a8f3535db",
    "institution_id": "315db95d-f8ac-46c6-991e-6ee3102904a8",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "7fc3f679-29b2-47bb-924a-1f089f28dbf4",
    "institution_id": "1d8867a4-61f9-47fb-a841-3584e5d05acb",
    "name": "Department of Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T08:23:02.681552+00:00"
  },
  {
    "id": "0d10b03d-c27f-4cfa-a8b9-d4452758be37",
    "institution_id": "32de4338-962a-4b12-ba2d-4e2dc2dcb7da",
    "name": "Doctoral Studies",
    "code": "DOC",
    "created_at": "2026-09-06T07:32:37.278925+00:00"
  },
  {
    "id": "3c7287ce-9485-4a8c-aecc-f9e010a62311",
    "institution_id": "79a71fb9-4700-46d7-a0af-224a9f383fec",
    "name": "Doctoral Studies",
    "code": "DOC",
    "created_at": "2026-09-06T07:32:37.989241+00:00"
  },
  {
    "id": "3bb88a2e-aec5-49f3-bfc4-7837245699a2",
    "institution_id": "7ff0a5c3-3a8a-46f1-b97b-d0870ea3d205",
    "name": "History & Counseling",
    "code": "HC",
    "created_at": "2026-09-06T07:32:37.677294+00:00"
  },
  {
    "id": "26b324a4-9495-4f51-8761-b29c69583209",
    "institution_id": "a6e92ed6-44d3-432f-a732-6a9a3d6db08f",
    "name": "Intercultural & Mission Studies",
    "code": "IMS",
    "created_at": "2026-09-04T11:51:00.323834+00:00"
  },
  {
    "id": "95062898-a3e7-4262-8964-e2e6b84cf934",
    "institution_id": "ea4171b3-9909-4860-939a-872cee2861da",
    "name": "Leadership & Theology",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.679071+00:00"
  },
  {
    "id": "0e3d3017-d112-47ce-a6be-67e90ee316f5",
    "institution_id": "32de4338-962a-4b12-ba2d-4e2dc2dcb7da",
    "name": "Missiology & Intercultural Studies",
    "code": "MISS",
    "created_at": "2026-09-04T11:50:54.139911+00:00"
  },
  {
    "id": "36703305-899b-457a-865b-e20dc203700c",
    "institution_id": "d7eaaa71-789d-44c1-94a1-d501bfabd382",
    "name": "Online & Distance Learning",
    "code": "ODL",
    "created_at": "2026-09-06T07:32:38.084593+00:00"
  },
  {
    "id": "be7cde1e-12ee-4b03-b0db-bdbf48d5a1d1",
    "institution_id": "79a71fb9-4700-46d7-a0af-224a9f383fec",
    "name": "Online Education",
    "code": "ONLINE",
    "created_at": "2026-09-06T07:32:37.943946+00:00"
  },
  {
    "id": "a4cbb654-5c79-436f-9329-fde925b4c15f",
    "institution_id": "9220ad6c-7bd3-4717-8e45-73bc79cda7c7",
    "name": "Online Education",
    "code": "ONLINE",
    "created_at": "2026-09-06T07:32:38.181749+00:00"
  },
  {
    "id": "b13fb09c-118c-4fdc-a86e-fa9b3399c880",
    "institution_id": "32de4338-962a-4b12-ba2d-4e2dc2dcb7da",
    "name": "Online Education",
    "code": "ONLINE",
    "created_at": "2026-09-06T07:32:37.22633+00:00"
  },
  {
    "id": "92afaff4-7921-496d-9596-e716ce8df3c7",
    "institution_id": "40d3ab25-f7e3-40e9-a8e6-5360bbe0ee57",
    "name": "Online Studies",
    "code": "ONLINE",
    "created_at": "2026-09-06T07:32:37.435907+00:00"
  },
  {
    "id": "e8a16c32-b851-4408-a41d-331e4b67d56b",
    "institution_id": "0e7567d2-df4c-4fe1-9ae8-c86e9ed70a51",
    "name": "Online Studies",
    "code": "ONLINE",
    "created_at": "2026-09-06T07:32:38.230774+00:00"
  },
  {
    "id": "51579f52-e630-4f8e-8693-9bbd18e4872a",
    "institution_id": "32de4338-962a-4b12-ba2d-4e2dc2dcb7da",
    "name": "Pastoral Care & Counseling",
    "code": "PCC",
    "created_at": "2026-09-04T11:50:54.645122+00:00"
  },
  {
    "id": "a543bc30-9fb1-4b7b-93f6-2f89bee20cd8",
    "institution_id": "ed8f7955-226f-436f-9ff6-104ff14a65df",
    "name": "Pastoral Theology",
    "code": "PAST",
    "created_at": "2026-09-04T11:51:02.93041+00:00"
  },
  {
    "id": "4002caf7-b565-4987-a049-8a5d0f0285d5",
    "institution_id": "40d3ab25-f7e3-40e9-a8e6-5360bbe0ee57",
    "name": "Pastoral Theology & Counseling",
    "code": "PTC",
    "created_at": "2026-09-04T11:50:58.09739+00:00"
  },
  {
    "id": "7d7a63d6-e907-4d2d-b5e2-6d6b3721b8da",
    "institution_id": "40d3ab25-f7e3-40e9-a8e6-5360bbe0ee57",
    "name": "Postgraduate Studies",
    "code": "PG",
    "created_at": "2026-09-06T07:32:37.486494+00:00"
  },
  {
    "id": "64f5d9d6-c1fa-44f5-9f7e-7e566374a10a",
    "institution_id": "32de4338-962a-4b12-ba2d-4e2dc2dcb7da",
    "name": "Postgraduate Studies",
    "code": "PG",
    "created_at": "2026-09-06T07:32:37.330783+00:00"
  },
  {
    "id": "f3124684-388e-474c-b8cf-e831346ac44a",
    "institution_id": "d5cd3e5f-2113-4fd7-a962-777cbb3aa9f2",
    "name": "Practical Theology",
    "code": "PRAC",
    "created_at": "2026-09-06T07:32:37.584057+00:00"
  },
  {
    "id": "757f3fd2-1e47-4d94-a1db-dee21a44b304",
    "institution_id": "6e531c2f-78a9-44b3-9905-661a98f302b8",
    "name": "Practical Theology",
    "code": "PRAC",
    "created_at": "2026-09-04T11:50:52.393527+00:00"
  },
  {
    "id": "8d3019f8-9dc5-4365-89ca-4ab2db3581d3",
    "institution_id": "8dcc7eac-69df-4cd1-b687-65fe76f14b97",
    "name": "Religion & Philosophy",
    "code": "REL",
    "created_at": "2026-09-04T11:50:56.512077+00:00"
  },
  {
    "id": "6043efae-c19f-404f-8181-deea084dcee1",
    "institution_id": "6e531c2f-78a9-44b3-9905-661a98f302b8",
    "name": "Theology",
    "code": "THEO",
    "created_at": "2026-09-03T20:08:12.164+00:00"
  },
  {
    "id": "693ece13-75e5-4240-97b3-99da70915a40",
    "institution_id": "50a48f4a-7142-4462-97ab-bc06aaf0036b",
    "name": "Theology",
    "code": "THEO",
    "created_at": "2026-09-04T11:50:58.620601+00:00"
  },
  {
    "id": "ea48df2c-b632-44ca-9bf7-ac8cb16f2f52",
    "institution_id": "0e7567d2-df4c-4fe1-9ae8-c86e9ed70a51",
    "name": "Theology",
    "code": "THEO",
    "created_at": "2026-09-04T11:51:01.39383+00:00"
  },
  {
    "id": "ce804815-6e7e-4abe-8c12-24b520f8edfd",
    "institution_id": "ed8f7955-226f-436f-9ff6-104ff14a65df",
    "name": "Theology",
    "code": "THEO",
    "created_at": "2026-09-04T11:51:02.412545+00:00"
  },
  {
    "id": "c1010ebb-8461-4a0a-8a92-806944d99103",
    "institution_id": "40d3ab25-f7e3-40e9-a8e6-5360bbe0ee57",
    "name": "Theology",
    "code": "THEO",
    "created_at": "2026-09-04T11:50:57.063364+00:00"
  },
  {
    "id": "b4255c06-6288-4077-8a3c-f17c0f13d59a",
    "institution_id": "5d205b2f-dddd-4219-8c03-72f43c3a5851",
    "name": "Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:37.785412+00:00"
  },
  {
    "id": "a0c8b6ae-918f-407f-b009-0be812dd54eb",
    "institution_id": "79a71fb9-4700-46d7-a0af-224a9f383fec",
    "name": "Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:37.892548+00:00"
  },
  {
    "id": "d56fc6ac-2a22-4741-b62a-a0c9171bfe6f",
    "institution_id": "4cbd543e-1a7a-4902-9841-9c15d7f807e4",
    "name": "Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.326704+00:00"
  },
  {
    "id": "e5069693-214c-450b-96ed-57dbdd56d652",
    "institution_id": "0310a75b-03ff-4b9b-a613-11042d16e080",
    "name": "Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.428665+00:00"
  },
  {
    "id": "4bff2cda-09ab-460c-8dcf-e313d9e65176",
    "institution_id": "a6e92ed6-44d3-432f-a732-6a9a3d6db08f",
    "name": "Theology & Biblical Studies",
    "code": "TBS",
    "created_at": "2026-09-04T11:50:59.806188+00:00"
  },
  {
    "id": "6ef88e67-05ef-4c5f-a242-b9f4556abfa6",
    "institution_id": "d953d61e-c47b-4d2b-a26b-d22f04e4ab85",
    "name": "Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.728287+00:00"
  },
  {
    "id": "fbf81e28-40b2-48f5-a60c-634eebb06522",
    "institution_id": "5da8e6d7-88ca-4b89-9260-4ff36aa13b5c",
    "name": "Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.87088+00:00"
  },
  {
    "id": "ca786dc5-0d31-4f66-a123-52c9243b32ea",
    "institution_id": "8dcc7eac-69df-4cd1-b687-65fe76f14b97",
    "name": "Theology & Biblical Studies",
    "code": "THEO",
    "created_at": "2026-09-04T11:50:55.324369+00:00"
  },
  {
    "id": "b0deb175-ff49-486e-846a-3b2befc3fd03",
    "institution_id": "9f6fca50-4296-41a1-9a8c-f747f828b06c",
    "name": "Theology & Christian Education",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.777323+00:00"
  },
  {
    "id": "d59db4af-dcb6-453c-9ae2-fea8524a1f25",
    "institution_id": "d1f0528f-69ff-47e3-a4f1-0711a9fa5d25",
    "name": "Theology & Christian Education",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.274472+00:00"
  },
  {
    "id": "3b2de3b7-070f-45aa-bf5c-5ca5834be202",
    "institution_id": "32de4338-962a-4b12-ba2d-4e2dc2dcb7da",
    "name": "Theology & Christian Ethics",
    "code": "THEO",
    "created_at": "2026-09-04T11:50:53.621934+00:00"
  },
  {
    "id": "a22cb607-770c-48c5-82e9-63727f54983f",
    "institution_id": "9ed89f8b-d1df-4093-953e-661525822381",
    "name": "Theology & Christian Studies",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:37.383837+00:00"
  },
  {
    "id": "ba37e1ce-3772-4bc6-990b-de7ac00077af",
    "institution_id": "d6abb3b6-7987-4276-b1f2-49c1bb606e38",
    "name": "Theology & Christian Studies",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.529208+00:00"
  },
  {
    "id": "f433dc3a-bffd-4396-94c8-c14f28968854",
    "institution_id": "d5cd3e5f-2113-4fd7-a962-777cbb3aa9f2",
    "name": "Theology & Ethics",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:37.533875+00:00"
  },
  {
    "id": "d2003bf6-1fd2-4b65-8d93-9bcac87badca",
    "institution_id": "f166a052-db20-4f62-b9de-f3d0c1883d18",
    "name": "Theology & Ministry",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:37.83371+00:00"
  },
  {
    "id": "b7c6741f-e4dc-41af-8b9b-ad23d961627b",
    "institution_id": "5fb1df8a-105f-4bdb-909c-cc43616166bb",
    "name": "Theology & Ministry",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.577366+00:00"
  },
  {
    "id": "b18da917-ce38-4889-96eb-eb40e813456f",
    "institution_id": "271f7a6c-e502-4599-9f83-ce1f514fae79",
    "name": "Theology & Ministry",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.824363+00:00"
  },
  {
    "id": "3afb6467-7a73-4479-bc83-d050435d9e71",
    "institution_id": "c0cf6cac-5496-4195-9a2a-4137c191fadd",
    "name": "Theology & Ministry",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.479362+00:00"
  },
  {
    "id": "5bc255f4-0bb3-48a8-ad6c-234095d2890b",
    "institution_id": "7ff0a5c3-3a8a-46f1-b97b-d0870ea3d205",
    "name": "Theology & Ministry",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:37.631917+00:00"
  },
  {
    "id": "4d23b83b-7f78-4206-ba0e-b2364408a459",
    "institution_id": "d7eaaa71-789d-44c1-94a1-d501bfabd382",
    "name": "Theology & Ministry",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.037745+00:00"
  },
  {
    "id": "558cd616-e509-4e02-b043-8ecf82b009f9",
    "institution_id": "b9ef8bbd-36dd-4051-a3af-9ae07c0265cb",
    "name": "Theology & Ministry",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.375918+00:00"
  },
  {
    "id": "7a7b083e-e06e-40ee-b9b5-e864c8307a74",
    "institution_id": "6e29a8f0-834a-4075-9e5c-aa722fe8bd1e",
    "name": "Theology & Mission",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.629881+00:00"
  },
  {
    "id": "320f6131-6292-4650-b014-65cbc42258ba",
    "institution_id": "ca4b5c1e-d78d-41ee-93c0-08a225799dc0",
    "name": "Theology & Missions",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:37.738617+00:00"
  },
  {
    "id": "86d52796-54ac-4135-90dd-9870085c2941",
    "institution_id": "9220ad6c-7bd3-4717-8e45-73bc79cda7c7",
    "name": "Theology & Missions",
    "code": "THEO",
    "created_at": "2026-09-06T07:32:38.132359+00:00"
  }
];

export const INITIAL_PROGRAMS: Program[] = [
  {
    "id": "19485a85-ce89-4d92-95b7-ca40d9900ad0",
    "department_id": "a22cb607-770c-48c5-82e9-63727f54983f",
    "name": "Bachelor of Ministry",
    "code": "BMIN",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:39.957851+00:00"
  },
  {
    "id": "8e402773-3147-46a1-9d9b-f000c3cc26a8",
    "department_id": "5bdc8884-2445-4663-af8a-e42219f18ac7",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "c920c4ea-c29a-4cfc-99a1-efb91df01f89",
    "department_id": "558cd616-e509-4e02-b043-8ecf82b009f9",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:43.434764+00:00"
  },
  {
    "id": "be1d2240-c24e-404c-bf3c-86163cb8685f",
    "department_id": "667418d2-790e-47e1-b780-cea0535cee69",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "e8ecfa11-6efe-4340-a30e-19e693f6bd97",
    "department_id": "ceeaed66-bf35-499e-9497-8cdc689444e6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "5df0b14a-befd-4bc6-a3ef-6fa66df0a8d3",
    "department_id": "298a101d-74c7-4b09-b416-b219f51d0b15",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "fee7653b-148e-491e-b820-6beaa4b3948a",
    "department_id": "a293b125-3bed-4798-a726-ce6fd633123f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "5bbcbfe4-e34d-4822-bc19-310f4b7fae14",
    "department_id": "16fd3961-f242-4f2f-80a4-86f858421fe9",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "a1d6b093-dee3-4abc-897a-62ee9de0d5f2",
    "department_id": "e12e7010-e492-4f7a-aad2-8418dd59661f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "f8be0768-f2dd-4ad8-bd2b-0380a75702ed",
    "department_id": "d3fe33ea-d836-4172-9030-0dcb5be6f573",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "0973f138-4f2a-4f04-a0df-8557c93ca15e",
    "department_id": "4452e861-be19-4d8d-9952-7859ef3c38c5",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "f847965c-63ef-46e2-b2a1-67b409a760fa",
    "department_id": "9bd047ef-b722-407a-9916-473c8e24d100",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "4f5a10a3-8870-4155-af82-b0442e385f21",
    "department_id": "5580330b-5fa3-47d8-84c1-8cf589e410bf",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "359be73f-cbc6-4cf7-8c32-488fde9a37dd",
    "department_id": "8da7d80a-eca1-46fe-89d8-83c8ab92d5b3",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "d818aaa4-d86e-43f0-b86b-070c9a844efa",
    "department_id": "3fdeaa03-919b-410b-81d1-3d58b202423d",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "f04aa4fb-abfd-4aa3-b141-a1cc0ff295ce",
    "department_id": "39ede850-015b-4ee6-a6a4-d7f837a5c50b",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "698e3967-9c6f-4e4d-950a-244c714685a8",
    "department_id": "b3b039d0-2908-4a1f-b87d-be4625f4388e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "d152159d-427c-4379-9560-0898c7afa26c",
    "department_id": "eabf2251-c8b2-4b40-9516-04d447cfbc77",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "d0a796ac-a0e2-4747-b284-48ebd5161553",
    "department_id": "f3821d2b-c012-409b-b288-b7b815bd0ce6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "498b4863-d01e-4f64-895a-9161d7c86a94",
    "department_id": "4b08487b-059e-4496-8bcf-e98d728d14ca",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "cc44cec0-eb65-4938-b41a-2b221f006f1c",
    "department_id": "c1010ebb-8461-4a0a-8a92-806944d99103",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-04T11:50:57.242072+00:00"
  },
  {
    "id": "d878e7ea-375c-4f77-ba47-c60a857d52f6",
    "department_id": "96b1fd6d-8a74-47b2-82b8-0ac1ad011acd",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "e93d3cad-3061-46c7-af0a-e67d9cfa176c",
    "department_id": "d8d64710-423d-4158-a054-857f4694e70d",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "d83bcc74-3397-4d03-9ae7-86b76865c386",
    "department_id": "9f55c64e-6eee-428d-8886-54b0ab0e1e8e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "a3faf26f-ea59-4e99-ae4e-074ada6de8fc",
    "department_id": "e151fa82-1c7a-4253-9ecb-6eb0be01e843",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "26d4408f-82c8-4117-b671-07ffb04ead25",
    "department_id": "7fc3f679-29b2-47bb-924a-1f089f28dbf4",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "4e914af5-cc22-44f7-a416-3cd1eac01c08",
    "department_id": "860acb81-c65f-4f98-aa21-49a22409d78f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "0e88d9e8-655e-406f-9b90-a7a0c19435a3",
    "department_id": "e72d7705-a1a0-4ddf-af95-54aeb0e59685",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "71db93be-42cb-4697-b1d0-174cce6f50e9",
    "department_id": "8dae2c63-e0e7-461f-8e20-c278c79d4bd0",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "4b6be2dc-9e86-45bd-a8ce-b9478335f4e7",
    "department_id": "642b6c16-d6a5-46b5-941c-f90081df78a9",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "090b1f79-bd30-4195-8623-0c84a57a2d93",
    "department_id": "66b6c510-72cc-426d-8d8b-8e738d47b12d",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "ddc7e24f-b49f-469a-9507-9645a739163e",
    "department_id": "d56fc6ac-2a22-4741-b62a-a0c9171bfe6f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:43.292037+00:00"
  },
  {
    "id": "902ec632-a5f6-4f81-9784-1d0d16acacb2",
    "department_id": "bf951b67-b4b7-4f9c-8f93-87de50eed8aa",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "ac2f0cf1-9b91-48ea-92c9-25cd999d36be",
    "department_id": "b0deb175-ff49-486e-846a-3b2befc3fd03",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:44.752595+00:00"
  },
  {
    "id": "7336cad2-f469-46ce-8674-49aa298a4b75",
    "department_id": "609074a2-3402-42b1-aee1-2a6dc90b2eed",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "359195fe-e120-4e5c-a004-5f8546b5bde2",
    "department_id": "2bbf45f1-6345-44c9-8bed-e87096f3bd80",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "8f567f61-4117-4a63-8216-2709f80a90e6",
    "department_id": "d1cc0cb1-d066-4262-945f-3c6b669ca9f3",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "dfe2238b-8ff7-44c0-9d5e-cac26705520f",
    "department_id": "0bdc2bf1-1eda-416d-bc8b-919b084457e7",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "a6af0abd-c7e8-43d1-b05c-bfa107882a77",
    "department_id": "7cc69375-a30b-4c37-9d72-55b986b6f69e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "2b0f3695-643d-468d-ac48-ade9cf4dd27d",
    "department_id": "052ddb0d-d547-4e5a-8192-74bd79ab6300",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "e08a42f8-5711-44a2-a718-d27c0c41f4b1",
    "department_id": "0c743554-2d28-4738-a7db-388b3a4a05a1",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.144502+00:00"
  },
  {
    "id": "e0c1863f-4a28-4030-b1aa-10cd4200a136",
    "department_id": "1286f06b-ff2c-4a08-b224-01668f6a260d",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "700fad53-8c69-439e-bcef-21f5c729ce9a",
    "department_id": "97d961bb-3a22-4d55-a813-f08d09e283b6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "40a39f1a-2ee5-4952-85b2-b4f284c1361f",
    "department_id": "b2f8e57d-04b5-418e-88f5-c7cdb6f26c4c",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "6ece0566-a29c-49a1-835f-cdecc11fc5d1",
    "department_id": "eb6d4422-3aa3-4268-9071-991a22b1792f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "fba2df37-6009-40b9-bcae-f21797b7ddfd",
    "department_id": "f56f5a42-b5f8-4c72-8363-032faa39600c",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "4573fe89-8edf-4fa6-a2f0-ea9affcb99d5",
    "department_id": "3d0fdc3e-8dd6-4536-8df3-786a622ab87e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "1015d710-8012-4211-bf01-caa02c2a79c8",
    "department_id": "ca786dc5-0d31-4f66-a123-52c9243b32ea",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-04T11:50:55.49478+00:00"
  },
  {
    "id": "8a5f4f3e-033b-4719-a704-10d4c28b1e8f",
    "department_id": "55e70d0b-5403-4fc5-ac13-eb98f1f87801",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "c9e93ece-42e7-438c-9dfb-bd8a5a8b6c8e",
    "department_id": "2c161351-11a7-4457-a9e5-37f517d3d444",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "63618958-cf24-4e0e-9307-0f8c6a1ec278",
    "department_id": "f736b665-41d4-4898-b887-5b00708ca3f5",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "b5b9c852-ae1c-4bfd-a3f3-6103e598e45e",
    "department_id": "e01d5da2-91d2-4758-b95e-acd2b55eb8ba",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "bcf2ee2e-bd39-437a-bc76-e868d51cb90b",
    "department_id": "e51ce36a-1d05-4376-91f6-ad90e437b8a7",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "52722016-af9e-405f-b2a5-0d72876e9bf4",
    "department_id": "b45d0a72-5f8c-405c-a715-8293b3b4dbf6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "a133bfa7-147d-46fd-9c2a-23c0e3a6b40b",
    "department_id": "1f9afc7a-12bf-4745-9f58-292a8d4a8a61",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "098867bd-c4ad-4d32-bef8-365674ef7252",
    "department_id": "e0e63fc4-256d-4941-9df8-d5d1e47b2714",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "c7dec041-6ca4-4083-a404-b87086df3eaf",
    "department_id": "d2003bf6-1fd2-4b65-8d93-9bcac87badca",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:41.609634+00:00"
  },
  {
    "id": "2bb2633d-5b83-4edd-9076-bf6e975b120a",
    "department_id": "66510648-c56a-4c36-9af6-0e0865ad325f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "1495dcea-4e2f-4a46-9acc-c879203304c8",
    "department_id": "429444ad-4615-4637-ac60-e1725f225b7f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "fdae488e-78b8-4eb9-acf5-2d7fc9f1394b",
    "department_id": "e5f140a7-ea78-4387-aa16-7342220622c5",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "bf8f6011-0a6c-4171-a0e9-7e0cf6b5f396",
    "department_id": "341223ca-c75d-41de-9325-815dc23e79a6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "4934e7d2-657d-45a4-8888-09a7d7c63b9c",
    "department_id": "c7eddd25-fd68-40ad-bb9a-b0f46fe891f0",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "8cae3e72-b95f-4eea-9af8-3a232a060bb7",
    "department_id": "4f62d074-d58b-4125-9c47-b5fbf8e6b335",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "163353b3-ef01-4bc0-8f9e-b96fe05b2c23",
    "department_id": "adc7363e-7702-4616-a277-98f24576b441",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "5bcd9045-e940-490f-83e4-5e51417e7869",
    "department_id": "2a3fab1c-034e-45f4-bef0-60fb1c23977f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "4a9a5fba-0a02-494b-821f-d882dfad06b3",
    "department_id": "e6348261-d09b-45a1-8e3e-cfb4361e219b",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "c1203e00-6ebe-4abb-8294-17ccd579b8c7",
    "department_id": "a22cb607-770c-48c5-82e9-63727f54983f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:40.007039+00:00"
  },
  {
    "id": "7ce045ae-c812-4049-b013-2c3484f015a1",
    "department_id": "c1200c7b-ad94-4706-ba06-e2310e2cda4a",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "0eba208e-203e-4c0a-9133-0872aec2318a",
    "department_id": "4124db1b-9d20-4bb7-99b2-935078f8c7b8",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "e0b152e8-bf5f-4f58-9a1f-d90db2766217",
    "department_id": "5ec29532-0774-4499-ac65-3cd140968b46",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "be9a0063-1b8d-4f67-8507-22e0e50a9b02",
    "department_id": "ee1b294c-0bae-40b0-a5a3-46b1230517bf",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "9352ab23-e31f-4d6c-a8a0-97262100353c",
    "department_id": "514c7b18-bf75-432e-b83a-d250347f91bd",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "10a6c2da-c1ea-42b4-8f54-f05e1499955e",
    "department_id": "dca47b11-8a02-4cc0-981f-671896fc3692",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "8e115d60-0c2a-4bd7-a15c-735548c8ada5",
    "department_id": "7fb084bb-b3a0-41fb-8d86-8f5c03ba8ff3",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "e6b88e82-77fe-4124-b689-d998ba8cc3fd",
    "department_id": "62a9155d-a40c-4253-9809-c243161a89b4",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "99afadee-aca9-4814-ba32-5b088ede688a",
    "department_id": "3b3e5a1a-a94d-4382-b51e-18ae6096b9d3",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "4e815c0e-a510-4185-9e48-9313369602e4",
    "department_id": "5de50c5e-3f4d-4e28-83cb-dd4aa5a4d19a",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "1e31692e-d298-4d01-952c-3585562f9c87",
    "department_id": "c3d8d41f-cb6b-42d2-9026-339da5b7ffe8",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "4f3ae015-8081-4ef2-9451-f14d5686108a",
    "department_id": "9141d4dc-63ab-4deb-b1a3-dedb3af0da5e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "0b86421d-3134-46f3-8530-0e4fb2d946fa",
    "department_id": "c0f77174-9c35-42b1-8e63-a95a9afae25a",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "6ec4a115-d9ff-4549-bf66-5451a4dfe444",
    "department_id": "0247b6c7-bfb5-4708-8991-589427a9d5b9",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "d0427711-3e1e-4614-8efe-c02aa5a9f749",
    "department_id": "06298975-62e0-45ea-8388-30b05e5c35eb",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "cbfe6146-d57f-438f-9006-876455098018",
    "department_id": "0c936f95-2ffe-473b-95d6-c6040308ee22",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "2a9e0aa5-e4e4-44b4-858e-c53b661a1c29",
    "department_id": "7289d7b1-df7a-4fe7-a2ae-cd55c9bd29ce",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "dca7f8a8-5652-43b3-8c53-a1ea6c3e865b",
    "department_id": "e77b8c4a-ec42-45dc-b513-ad33a5329d8f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "e673f6f0-caf3-4c1f-bcc3-d924b383146d",
    "department_id": "da081e85-f648-45d1-8938-94d9b53d1190",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "092518fe-e1a2-4890-9ac9-ea80d32e03f7",
    "department_id": "9fad4dd5-55b5-440b-b59f-899a1eaa6b15",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "a23aae58-e874-4bed-b867-9ec4854ac1f6",
    "department_id": "60c3b366-a794-4ba5-ac02-f3e15be2ea4f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "0ce626fd-370b-43f6-a795-a024bf2550d4",
    "department_id": "b7c6741f-e4dc-41af-8b9b-ad23d961627b",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:44.304486+00:00"
  },
  {
    "id": "aa98cd7e-f0bc-4c66-841c-5df20281f94d",
    "department_id": "8d458a1b-c28f-40a4-9be8-84f6c2e58b11",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "f79326fa-78e9-4aee-a0dd-7d27ae581224",
    "department_id": "33c6aaed-63c0-465f-8608-3da4df8cfc91",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "9af6379f-ef90-4d2a-8024-ba1b01d5b667",
    "department_id": "e71f8478-1368-48ee-a4e1-95ee0740acbe",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "32fea4e5-6ecf-4c27-bc33-4c0f66526ba6",
    "department_id": "e6dd8d2a-36a0-49e7-bd0d-c233f65f9582",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "f4fe95ff-c6de-47f7-bebd-43190514a663",
    "department_id": "85527bb4-320c-4f21-8144-c38c3a89757d",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "bf3ff529-78ad-4a63-bfe5-017f3ea4728a",
    "department_id": "94dcf306-b0d3-4410-9b09-db7ff6c49f15",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "f61b55c2-750e-4efd-92e9-ebd317b6c3ee",
    "department_id": "8c334237-e6c0-40ef-96fa-99e9064cb28d",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "c8aa7801-a948-4ee1-90bb-654e24231adb",
    "department_id": "a80c86ea-ba91-4218-9178-2d50e472c303",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "e802b47a-691c-472b-8a9f-8eae24bb78ab",
    "department_id": "41805d2c-684c-4ae5-a5e2-32b1c1fdf898",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "7aec1812-7ada-4b07-8dc6-363aa62043a3",
    "department_id": "14cbe224-5a00-4ab8-9c40-6dd22f33a747",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "47e394fb-b8c2-4618-b97f-b5cbc2cf1995",
    "department_id": "c25fd5fb-3690-4ad9-bdc1-c010b6b564da",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "1230566f-72ed-44f7-9b8f-2a95473f0aa4",
    "department_id": "dcf41bf0-37f7-4014-bc59-de9980c647e8",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "a15525cd-7683-47bf-94f7-981cd0f332eb",
    "department_id": "4687cef7-544f-488c-8976-300fb0a5f67e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "34bf0254-a121-4c6c-b2b1-0f337604de03",
    "department_id": "4c59d98f-5f43-4eb9-b507-afaab1b8a12b",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "5872a7c5-7fa4-4704-b67d-19f0989fc5bc",
    "department_id": "6133c916-d438-4ab5-ad8c-976df1cccebe",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "113144ff-4d26-462f-af8a-2158821cef76",
    "department_id": "e9b3d126-b2b0-47ac-908d-3b6896122cf2",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "1316488f-c69a-4df0-85bf-9ec1abb3400f",
    "department_id": "c49677e2-c1c4-4926-8323-120a3693fe77",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "536f2a67-4c2b-4a73-a324-7fab743398a5",
    "department_id": "5036fee2-7f17-4e86-8297-ee4401cd976e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "b5e3e224-3fc1-4e42-8a5f-c761f53114f4",
    "department_id": "6df877cc-2e7a-4da1-93b2-520ed0e25816",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "5dc9450a-b136-460a-98b8-ef0a3c1a48dd",
    "department_id": "58578c78-38f7-441f-b71f-87e1dee7c04a",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "a2f1c88c-f7cc-4c87-bd64-967797118d74",
    "department_id": "2c859d33-056c-4586-b662-ad4159ac78f6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "913e236b-ce76-4d42-88ed-d8d20c654120",
    "department_id": "95899934-1e17-4e12-b4d7-def27341fcf2",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "b5eb576c-72f4-492a-8217-ab8c8ded9351",
    "department_id": "9b800552-fcc7-4aca-bab9-9e9bdc1618c1",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "0cfd1bf4-d44d-4691-9cdb-6098da7c270f",
    "department_id": "6d1a561c-bd46-451b-a385-1463ce16bbb9",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "e4a3636e-6b00-488f-b9ce-dbce9eebc8b0",
    "department_id": "06dde63d-8e41-4101-9d6b-170d49731afb",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "797902d2-1c68-4287-95fe-84e6afdd0dc5",
    "department_id": "ba37e1ce-3772-4bc6-990b-de7ac00077af",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:44.163172+00:00"
  },
  {
    "id": "efe484bd-3b72-4ccd-a7d0-946380973de9",
    "department_id": "320f6131-6292-4650-b014-65cbc42258ba",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:40.977612+00:00"
  },
  {
    "id": "1c994728-f813-4087-b694-a3d82e4106de",
    "department_id": "77585fd0-508a-404b-bcb2-58c151c99fcc",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "43c56862-4f1c-45af-b8dd-d66330f150d1",
    "department_id": "248b1121-3088-4fb0-8229-c153973ec662",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "c2ee608d-f6c0-46f4-a7fc-b05504adad27",
    "department_id": "ae4c6a8c-d5a6-4c9d-8484-5dc41c80bf4a",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "969ef7f6-db68-4c12-8eb0-6cc2582d460f",
    "department_id": "2dde32a0-2677-405e-a63b-4c6894b1248a",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "3a03c14c-8443-46f8-82f4-28a41d921baf",
    "department_id": "5315f616-77e2-4abd-9e8c-b4b371765646",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "e52aa6a3-7753-4515-acba-e3c106580c4d",
    "department_id": "3b677a48-fb0c-4cc5-a5e9-a90908454fa6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "55151789-32a7-4608-807e-ff0bc9247134",
    "department_id": "00f23b94-b51d-438d-b6fd-257e4ded39eb",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "6d02504d-4102-4f9b-bbcf-0e144befb7fb",
    "department_id": "73c3d6b4-a2f5-45f3-9d6d-01b20cd1fc7e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "a008143b-6f85-4541-b9cf-38896f6f4a38",
    "department_id": "e9f756da-9cfc-4aa2-ba75-5ae3dbeb2351",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "7664649e-b01a-4ef9-9287-ccd2f192dd77",
    "department_id": "b5e5b62b-53fe-490a-8427-5bcbaef7f07e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "e8cc8cf8-8b1a-4466-a98d-43348a5d9316",
    "department_id": "95062898-a3e7-4262-8964-e2e6b84cf934",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:44.559398+00:00"
  },
  {
    "id": "60aef419-8c4b-485d-9d06-3012cf6c86e4",
    "department_id": "7850604d-4d90-484a-8f8c-1a81058100c0",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "cc4d8f0d-c347-4365-b4c8-e9eb027f37a5",
    "department_id": "b4255c06-6288-4077-8a3c-f17c0f13d59a",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:41.267626+00:00"
  },
  {
    "id": "40ea5c8a-f551-46d5-b1dc-87be778716ba",
    "department_id": "858d7677-6673-472a-be88-4cd8169543e3",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "a90376b2-eb1d-4447-aa8c-289268191b11",
    "department_id": "60dcb668-2945-4c36-9572-ffea17f04c65",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "471df55d-6e9c-497b-8d78-7bd8edef43d3",
    "department_id": "b536f10e-ed19-47f4-a6a7-b19d39736715",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "3591a599-8c7b-4da7-bb59-2d05f78fb458",
    "department_id": "674160ce-5053-4c18-96e7-eea7dc74921a",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "dbdfcf06-3db4-4600-a50f-c313e69a404d",
    "department_id": "914f3ba0-b33b-40a5-b7b2-76b2a636ba38",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "5bbb9ec1-df72-44dd-9afc-6c74da0087c8",
    "department_id": "2bb5fd82-e5ad-46ae-b769-3d1a8f3535db",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "1504e850-b8d2-43ad-a658-c5177255bf29",
    "department_id": "7a7b083e-e06e-40ee-b9b5-e864c8307a74",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:44.41382+00:00"
  },
  {
    "id": "f709ca8d-7dea-490c-97fa-1382ad5b74d1",
    "department_id": "ad932cf0-e664-4495-a6f8-5e000aaf339b",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "9b2e112d-af02-471b-b641-a5656acdbbdb",
    "department_id": "fb949836-12d6-4a29-886c-5ddcd928fc68",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "fb783586-e0e1-4b0e-97db-f7fe1876ad9d",
    "department_id": "22af8c34-5e5d-439c-a6fc-a088f609b125",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "74fc1c71-73a2-48e7-b7de-35187fff4d02",
    "department_id": "cce044d7-eab4-4652-931a-c0dfaf7bb4e1",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "5bfb716c-d569-46bc-929a-8ee6eb6c07dc",
    "department_id": "78b18e20-da8e-4ff0-86a2-5e9d46e113e2",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "c203881e-a5e2-4290-9341-b7989afb33b9",
    "department_id": "459f14de-a6e7-41d2-8f6a-a1e305e37693",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "3d1a44f7-3c9f-43f2-8a2a-3d1148c9b142",
    "department_id": "0e0fe759-922c-4abf-9945-2e6472dce8e6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "529b475b-6ee0-465e-aaa0-961cc43bc79e",
    "department_id": "0fac5da9-ef57-44e8-909e-c36f485e39db",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "3642cdc4-de7f-4dcb-8a44-47d8682c6b8c",
    "department_id": "481b3c3b-02e4-4011-8e8b-e782dddbc19b",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "c898d3d1-c399-4434-b845-4d805908c41a",
    "department_id": "0431ce35-419e-4fc5-8ad2-643fe9b1ff30",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "04dff622-c77e-4fd3-9290-678b3203943c",
    "department_id": "6043efae-c19f-404f-8181-deea084dcee1",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-03T20:08:12.495772+00:00"
  },
  {
    "id": "f8cc9671-7403-46cc-b781-c2ce3f327be0",
    "department_id": "85eca5f4-0ac2-4e8e-839c-30b72cccbba6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "a77528b1-a979-45fb-9a07-cd9db1b4a172",
    "department_id": "264843fa-a9cf-4864-a434-32935e4ab6f5",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "35e25666-28bf-4174-b5a9-e00be39263d9",
    "department_id": "3afb6467-7a73-4479-bc83-d050435d9e71",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:44.009224+00:00"
  },
  {
    "id": "4655af77-9649-4bec-b0f7-48fc70646244",
    "department_id": "d59db4af-dcb6-453c-9ae2-fea8524a1f25",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:43.183326+00:00"
  },
  {
    "id": "ae4da4ec-921a-4203-bbe1-ede79bee56cb",
    "department_id": "56ef12fa-a98c-425e-b803-f903a464af5e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "699103a2-c9ad-4380-af0f-dd3d04f1ce0b",
    "department_id": "c6baca87-beb6-4283-8f67-aa0236644b91",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "6bacc8d3-f57e-488b-b5cf-30e9cdae6e3d",
    "department_id": "501e993b-a036-4650-adb1-a58b986a1fd7",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "2374dffc-8e56-4730-b103-e885faf0576a",
    "department_id": "652a6d57-53cc-4adf-ad5a-5dd1d7a2d271",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "8b21bc5d-6fa3-4fd2-9a47-1591de97059c",
    "department_id": "a9c3365e-72c2-4ea9-af74-bcc17d53372a",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "06491ec0-226a-4c1e-b5bd-62f03527276e",
    "department_id": "7139477e-3ca2-4878-9d8c-7c3234f29034",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "dc425334-ba38-4554-85a5-350e1d8ae64b",
    "department_id": "3ec7f283-6ed1-4e17-8729-7dcefb85aac6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "efb3f88d-5204-4fb0-ae9e-e3def3bbe5db",
    "department_id": "6ef88e67-05ef-4c5f-a242-b9f4556abfa6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:44.656801+00:00"
  },
  {
    "id": "2c74388c-818f-4249-bdde-ab36fa71b1e8",
    "department_id": "f900ec42-d48a-44ef-a94b-3c9cd4c28124",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "ee730b62-aa9d-4f63-8377-28a6cd0825e6",
    "department_id": "ce804815-6e7e-4abe-8c12-24b520f8edfd",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-04T11:51:02.585648+00:00"
  },
  {
    "id": "f6610477-9681-436f-81cf-e7a9f0cd58ce",
    "department_id": "08b1dfaf-469d-47d1-b093-2b9614af6cf5",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:45.123928+00:00"
  },
  {
    "id": "a8ae6268-4940-4144-bb5e-ff793807a61a",
    "department_id": "4635244f-4bab-45d0-a0a3-0a55a639f196",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "e1c54458-afcd-447f-8350-b89f36052dc5",
    "department_id": "4aa3858d-a701-4745-893c-7e1a6fdb1e76",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "1aa77d36-48b1-4ce1-a9c0-8b949dd690df",
    "department_id": "8e059ed7-1714-4d8c-8d68-d023520d988b",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "9a8aec40-9d50-4309-95c0-309c20644d31",
    "department_id": "d3e09725-e53d-4947-8502-ba74dd836876",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "f8661829-5d82-4044-9743-2d4c2c30ffb5",
    "department_id": "3cc21a46-06d0-46e3-99b2-0988a15cb1f4",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "2823b0fa-c210-41ae-9ad5-e0723d610083",
    "department_id": "1cc2b5e9-e15f-4767-975f-20a8881c9908",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "15ec1183-1216-4ca8-a967-5ebea4bdba63",
    "department_id": "cc2c5d68-d115-440d-8d88-2fdf5c82f394",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "8a118f76-3be7-4b73-bc3c-8ca0f9f09392",
    "department_id": "c5bc5c63-e83c-4662-95d3-aa554e767a31",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "d726ac64-1233-4e2b-ae74-c9801b033ea8",
    "department_id": "58fa2e1e-9ed6-4465-954d-aee142622ec1",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "2811e52a-96e9-4b5a-b17f-6f4ef6386cf0",
    "department_id": "d883711d-039f-49bf-981f-3c283600e697",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "7b1b0158-01d2-4eff-ae2b-b70cf5eafe34",
    "department_id": "ed54e04e-b356-4bc4-98eb-01e5f9167d68",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "1dc2ebe5-740c-4c1d-960c-83ce033b58d2",
    "department_id": "9ae71be5-a9b8-47b8-affb-fd6f486957df",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "b7584555-b1b4-4bfb-a14b-da5082b804fc",
    "department_id": "975cdfc5-3978-474c-94f1-0b29992fc0c6",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "f7651141-d253-440b-bee7-20dc0d6a7e47",
    "department_id": "249c35a4-17fb-4c23-a074-e4ca7a584cfc",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "16b93b39-e271-486d-b9b5-34c70418c086",
    "department_id": "564d9526-8f95-4238-8c9e-1f6ec7fe6a00",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "0ac78c98-5e85-49f3-b003-187d037a3099",
    "department_id": "ea48df2c-b632-44ca-9bf7-ac8cb16f2f52",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-04T11:51:01.566742+00:00"
  },
  {
    "id": "8f7bdd7a-5bcf-4a63-93bb-cf6b5bb0c704",
    "department_id": "e5069693-214c-450b-96ed-57dbdd56d652",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:43.864689+00:00"
  },
  {
    "id": "c5645abe-db18-4e95-b4af-1806349d05f9",
    "department_id": "991a92fd-33f7-44be-a01e-aa9a5e8e3ac3",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "dacb07eb-9e7a-4b22-a656-daeb9b2f52b9",
    "department_id": "1b53c176-8300-4c5b-a8ad-0d03550c2e09",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "344628f2-c5a1-4c5b-9758-d013de27481c",
    "department_id": "714de06c-b22d-4c69-b1b6-a8ba89618046",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "08c1fbad-9be2-49b0-8139-3e4449e3dbc7",
    "department_id": "fac957ec-8628-48af-9c4a-012bf970a1e2",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "fd8d5361-80a7-493d-9b16-709cfe030e2a",
    "department_id": "436005ef-4ae4-430f-948e-38c7ab5e5b8b",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "bde678c5-7ac3-4f45-a8a0-f0e53a9b7a36",
    "department_id": "ad833830-8b32-46ea-a9d2-3e6e5219d747",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "191d9ca2-e5b4-4c6c-bc36-b5043819c025",
    "department_id": "fbf81e28-40b2-48f5-a60c-634eebb06522",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:44.91486+00:00"
  },
  {
    "id": "c705fb45-448d-4306-85b6-06bf155034e2",
    "department_id": "86d52796-54ac-4135-90dd-9870085c2941",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:42.694768+00:00"
  },
  {
    "id": "13223c50-7aad-45de-b6c2-8cffc8755073",
    "department_id": "3d87f153-54bb-4738-9910-be8668a99baa",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "2f085dc0-5d90-4737-84d1-f46e6c67eb7e",
    "department_id": "5c043e79-6acd-49de-af6e-00fbf67d6e34",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "f898a50a-7c3c-4e5f-a196-d6f6400d03cc",
    "department_id": "0f98439d-4220-46bf-846b-3689b020854e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "be06f636-1c97-45c7-acec-212df1796d65",
    "department_id": "401df322-3ff0-417c-8132-292b6d969e72",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "1c7f3a07-d4a5-47b8-a7e0-203f5c9c4131",
    "department_id": "0a3897ce-2402-4167-9ee5-ffafbe875be2",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "8595019d-f5c9-4364-936a-f889969949bc",
    "department_id": "50cdec84-89f3-41f5-b3c5-71a3c47e4fd2",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "5970b78c-1e92-4739-a132-9077debb7244",
    "department_id": "5c5c8c50-d06f-4d8f-aa64-512a76a1aa0f",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "9191643e-f0ce-4e6a-94d7-528170e40327",
    "department_id": "e22db4fe-e166-439e-a97f-751547921a04",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "0ab650db-9253-4817-b26f-fa0a59b3ebec",
    "department_id": "4bff2cda-09ab-460c-8dcf-e313d9e65176",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-04T11:50:59.978068+00:00"
  },
  {
    "id": "87e81d9c-ce1c-4029-8cb1-14f73fff8f4a",
    "department_id": "c42eb7bc-31c8-4aaf-af30-be36df0e31c4",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "ecca1a58-a1a5-4412-9461-1273165c6dc9",
    "department_id": "de4aa189-fba2-4842-b83f-3258d54a1340",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "df9f0ff4-1bf6-4c65-8d81-765140d022e1",
    "department_id": "9124b249-b5d7-454f-933b-a621b40f2e4e",
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "cd488e40-f082-4fa1-af7a-7d8ea0650117",
    "department_id": "693ece13-75e5-4240-97b3-99da70915a40",
    "name": "Bachelor of Theology (Bi-lingual English & Hindi)",
    "code": "BTH-BI",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-04T11:50:58.789623+00:00"
  },
  {
    "id": "d7d62cb2-0c1f-4f9d-8ef6-58f2dc86fdd8",
    "department_id": "4d23b83b-7f78-4206-ba0e-b2364408a459",
    "name": "Bachelor of Theology (Residential)",
    "code": "BTH-RES",
    "degree_level": "UNDERGRADUATE",
    "created_at": "2026-09-06T07:32:42.508716+00:00"
  },
  {
    "id": "9ef5393c-5f94-42d9-943e-2f7f780bc065",
    "department_id": "3c6fde2c-c7f3-4f1c-b41d-f91730a5668f",
    "name": "Certificate in Ministry",
    "code": "CERT-MIN",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-04T11:50:59.462734+00:00"
  },
  {
    "id": "e2240d60-951d-4420-957e-50f8f2deebc2",
    "department_id": "a80c86ea-ba91-4218-9178-2d50e472c303",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "bcaf8a71-19f9-464d-a338-f251307a0a15",
    "department_id": "9fad4dd5-55b5-440b-b59f-899a1eaa6b15",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "8a278c38-fd7c-433b-8574-e5c48a6e72fe",
    "department_id": "0fac5da9-ef57-44e8-909e-c36f485e39db",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "ee6a360f-ce26-4a03-8182-39063d29e507",
    "department_id": "e9b3d126-b2b0-47ac-908d-3b6896122cf2",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "eefdfda4-082b-40fc-92aa-061562145ca5",
    "department_id": "e22db4fe-e166-439e-a97f-751547921a04",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "59306ef6-1ed5-41fa-988d-16c9ec57df0d",
    "department_id": "95899934-1e17-4e12-b4d7-def27341fcf2",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "933da812-5c39-4e1c-8b91-22fe1d3fe389",
    "department_id": "e6348261-d09b-45a1-8e3e-cfb4361e219b",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "6a0cf05d-8773-4563-8775-cdd1d363d97a",
    "department_id": "c3d8d41f-cb6b-42d2-9026-339da5b7ffe8",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "6f0360b5-a761-43d2-a2e4-434fa9edf454",
    "department_id": "1cc2b5e9-e15f-4767-975f-20a8881c9908",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "c5b28275-5e4e-44ba-a475-560005adf953",
    "department_id": "6df877cc-2e7a-4da1-93b2-520ed0e25816",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "35f101c3-78ef-4fe9-8a32-673cfef76fad",
    "department_id": "e5f140a7-ea78-4387-aa16-7342220622c5",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "63457df7-0f53-4161-b976-092e8cc54100",
    "department_id": "8e059ed7-1714-4d8c-8d68-d023520d988b",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "ddea1f79-c0a7-4569-8456-7713c4abc706",
    "department_id": "c1200c7b-ad94-4706-ba06-e2310e2cda4a",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "0656cd8a-8ab5-4ee9-98ec-110e2852b09e",
    "department_id": "341223ca-c75d-41de-9325-815dc23e79a6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "9f491164-8435-4685-8d94-897eac05ea63",
    "department_id": "97d961bb-3a22-4d55-a813-f08d09e283b6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "c2e8bffd-553e-4072-a59c-4dec569423e9",
    "department_id": "4f62d074-d58b-4125-9c47-b5fbf8e6b335",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "a098a4a2-82e2-4a08-b4bb-0b4f65bb7a8b",
    "department_id": "d1cc0cb1-d066-4262-945f-3c6b669ca9f3",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "3eac7a9c-6b15-4de4-b402-7fb6baf76e50",
    "department_id": "c7eddd25-fd68-40ad-bb9a-b0f46fe891f0",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "0fd4d8fb-d0ac-449f-a4e5-e2b94bc0ba0f",
    "department_id": "7fb084bb-b3a0-41fb-8d86-8f5c03ba8ff3",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "ea23a93c-6f4f-45a8-b05e-4da9ed1020c9",
    "department_id": "85527bb4-320c-4f21-8144-c38c3a89757d",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "f350ddb1-8969-4673-a27f-d379a1d7a7a7",
    "department_id": "e6dd8d2a-36a0-49e7-bd0d-c233f65f9582",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "e23f6d1a-8da9-43fd-a36c-38844d7fed05",
    "department_id": "0c936f95-2ffe-473b-95d6-c6040308ee22",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "b4132c32-bd3a-4c61-8642-b3bb4b4934fa",
    "department_id": "e71f8478-1368-48ee-a4e1-95ee0740acbe",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "5fa89e56-d148-44fa-9bd3-b1cac1192522",
    "department_id": "248b1121-3088-4fb0-8229-c153973ec662",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "e18501d6-0063-4367-8ed4-481144a6816f",
    "department_id": "dcf41bf0-37f7-4014-bc59-de9980c647e8",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "1e7c0ed9-2a8b-4328-b219-f1b7554df3b8",
    "department_id": "914f3ba0-b33b-40a5-b7b2-76b2a636ba38",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "2fdc149e-feaa-4f48-9e4c-3080f6e66794",
    "department_id": "b5e5b62b-53fe-490a-8427-5bcbaef7f07e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "14153d06-2e0c-4a60-be5e-35eac90c3069",
    "department_id": "2dde32a0-2677-405e-a63b-4c6894b1248a",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "eb55ed39-4e54-491e-bdce-c7c0c074350a",
    "department_id": "2c859d33-056c-4586-b662-ad4159ac78f6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "04938e22-8a98-4497-a5b0-7f58dd7d4dfb",
    "department_id": "ae4c6a8c-d5a6-4c9d-8484-5dc41c80bf4a",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "17b16db7-99a2-46a5-83f3-5b85b4f502b1",
    "department_id": "7850604d-4d90-484a-8f8c-1a81058100c0",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "196f41c2-8574-441f-ad0e-9fc945c10d11",
    "department_id": "5315f616-77e2-4abd-9e8c-b4b371765646",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "862c5ee4-1287-48e3-a460-22439e371dda",
    "department_id": "ad932cf0-e664-4495-a6f8-5e000aaf339b",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "77d68df0-df94-4861-94cf-7aaef415284e",
    "department_id": "264843fa-a9cf-4864-a434-32935e4ab6f5",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "bd7374ca-c692-4904-9ec7-dab023f8dcaa",
    "department_id": "c5bc5c63-e83c-4662-95d3-aa554e767a31",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "bd5d12e5-3677-41d1-87d5-3c43e6e9099e",
    "department_id": "9ae71be5-a9b8-47b8-affb-fd6f486957df",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "36cccb62-0461-47bf-a880-d7544d8f06b3",
    "department_id": "4aa3858d-a701-4745-893c-7e1a6fdb1e76",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "7815807d-5606-4a88-865e-59e96584cce7",
    "department_id": "1b53c176-8300-4c5b-a8ad-0d03550c2e09",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "823d524d-4122-4181-996d-6cf2ae22c76c",
    "department_id": "ed54e04e-b356-4bc4-98eb-01e5f9167d68",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "f2ddd7de-6939-4401-8a07-7b9bf67f1845",
    "department_id": "459f14de-a6e7-41d2-8f6a-a1e305e37693",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "ae301518-7fb1-4355-b461-00a199747195",
    "department_id": "0e0fe759-922c-4abf-9945-2e6472dce8e6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "c262985f-1cd7-429c-9d27-c6c6cdb55e4a",
    "department_id": "714de06c-b22d-4c69-b1b6-a8ba89618046",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "0a0575cd-da77-4cb6-9b0c-949cbe55cf48",
    "department_id": "5ec29532-0774-4499-ac65-3cd140968b46",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "bd8a39df-e67c-4e4e-9171-5650bb2ee790",
    "department_id": "401df322-3ff0-417c-8132-292b6d969e72",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "0629a26f-f551-4849-93b2-74ffce7cf6b2",
    "department_id": "8da7d80a-eca1-46fe-89d8-83c8ab92d5b3",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "195336e2-0f51-4c21-919e-d112e11712b3",
    "department_id": "4124db1b-9d20-4bb7-99b2-935078f8c7b8",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "e85b9701-861e-4f16-95a0-fe9f08bf3067",
    "department_id": "298a101d-74c7-4b09-b416-b219f51d0b15",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "00772287-e72c-4910-a492-e8a53295a130",
    "department_id": "e151fa82-1c7a-4253-9ecb-6eb0be01e843",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "c9902ef8-17ea-4af2-aa18-7fea8fcc1ef6",
    "department_id": "3fdeaa03-919b-410b-81d1-3d58b202423d",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "515327da-ec71-49f0-95b8-8ac0e1033ac0",
    "department_id": "0c743554-2d28-4738-a7db-388b3a4a05a1",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.144502+00:00"
  },
  {
    "id": "6607c47b-86f4-4290-b259-16ad6c072e15",
    "department_id": "9f55c64e-6eee-428d-8886-54b0ab0e1e8e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "beaee694-453c-4bb9-bc0a-95eb9437c247",
    "department_id": "2c161351-11a7-4457-a9e5-37f517d3d444",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "6c8cc9d9-31f7-4452-93ff-84218b1fcdd0",
    "department_id": "a293b125-3bed-4798-a726-ce6fd633123f",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "6a342fcf-a16a-44c4-bc79-c99679a87b7f",
    "department_id": "bf951b67-b4b7-4f9c-8f93-87de50eed8aa",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "305b19e8-70df-45cf-b41e-4b8cd7ca5f1c",
    "department_id": "e01d5da2-91d2-4758-b95e-acd2b55eb8ba",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "1c6f13aa-159f-4c22-a77f-5263495731aa",
    "department_id": "1286f06b-ff2c-4a08-b224-01668f6a260d",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "26cb558c-9b71-4261-9550-72b9242b8e15",
    "department_id": "f736b665-41d4-4898-b887-5b00708ca3f5",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "95c8b7ce-a7bb-4335-8d78-00c61754e672",
    "department_id": "436005ef-4ae4-430f-948e-38c7ab5e5b8b",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "9bddf4f7-a2b1-4aeb-a957-f3738338b683",
    "department_id": "7289d7b1-df7a-4fe7-a2ae-cd55c9bd29ce",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "f82bf797-1128-42c7-b73e-259011826056",
    "department_id": "e0e63fc4-256d-4941-9df8-d5d1e47b2714",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "d24f2f5a-eb9f-4d78-a8fb-d9b23092f439",
    "department_id": "7fc3f679-29b2-47bb-924a-1f089f28dbf4",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "e1015bcc-37ab-4e99-8e86-d958500d67f7",
    "department_id": "052ddb0d-d547-4e5a-8192-74bd79ab6300",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "75f207f4-86bb-4df5-ba53-7b91afd06366",
    "department_id": "eb6d4422-3aa3-4268-9071-991a22b1792f",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "fdcdb2a9-500b-4809-b225-1c54e5ff8ea0",
    "department_id": "e51ce36a-1d05-4376-91f6-ad90e437b8a7",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "2b20c2a8-0209-4908-a061-9b5f5defbe07",
    "department_id": "3d0fdc3e-8dd6-4536-8df3-786a622ab87e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "dac25b8a-72ce-4215-88f2-87a74f21f2bc",
    "department_id": "55e70d0b-5403-4fc5-ac13-eb98f1f87801",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "f87c90a0-ce66-408d-9c84-d26722e48048",
    "department_id": "b45d0a72-5f8c-405c-a715-8293b3b4dbf6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "f908e431-89d7-483b-9cdc-da345fa61314",
    "department_id": "b2f8e57d-04b5-418e-88f5-c7cdb6f26c4c",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "80eb8ea7-40b7-4690-9056-51b0afcd30fe",
    "department_id": "8dae2c63-e0e7-461f-8e20-c278c79d4bd0",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.144502+00:00"
  },
  {
    "id": "a42f15b9-77e8-4de1-9fc9-1f90c31f3ba4",
    "department_id": "2bbf45f1-6345-44c9-8bed-e87096f3bd80",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "c8296330-fa19-48f5-b027-c87ce9bbd0c3",
    "department_id": "7cc69375-a30b-4c37-9d72-55b986b6f69e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "c96d3ac3-ea79-43d8-be20-5c16672d633d",
    "department_id": "96b1fd6d-8a74-47b2-82b8-0ac1ad011acd",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "f0988fb6-8e3f-4afb-8521-2480ccbfa45c",
    "department_id": "0bdc2bf1-1eda-416d-bc8b-919b084457e7",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "42974e45-94f2-4682-bd37-78028291c248",
    "department_id": "609074a2-3402-42b1-aee1-2a6dc90b2eed",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "8ff6caf4-315d-47e3-874a-9ddea9594efc",
    "department_id": "eabf2251-c8b2-4b40-9516-04d447cfbc77",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "6b9798b5-e033-466e-9e53-fc75f3c3f1aa",
    "department_id": "860acb81-c65f-4f98-aa21-49a22409d78f",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "f27588f2-2867-4094-b52d-fee01b7e60b2",
    "department_id": "4b08487b-059e-4496-8bcf-e98d728d14ca",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "78187f50-e06b-4e91-a24e-31a9216dae25",
    "department_id": "4452e861-be19-4d8d-9952-7859ef3c38c5",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "53e7d287-adc1-4801-b5e4-d7840993a46d",
    "department_id": "b3b039d0-2908-4a1f-b87d-be4625f4388e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "7c23d2f5-18a2-4ba2-b343-f07c7c436c7b",
    "department_id": "642b6c16-d6a5-46b5-941c-f90081df78a9",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "a2f77a7a-adda-4f21-bec7-d824f8b874a9",
    "department_id": "16fd3961-f242-4f2f-80a4-86f858421fe9",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "317c66b2-562b-4213-81eb-05c8b139cc71",
    "department_id": "9bd047ef-b722-407a-9916-473c8e24d100",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "76ffaad4-31e9-4d76-b9cc-ad9a412b9c81",
    "department_id": "41805d2c-684c-4ae5-a5e2-32b1c1fdf898",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "40c76bf1-138a-48bb-9a3e-1655e5bd5c18",
    "department_id": "e12e7010-e492-4f7a-aad2-8418dd59661f",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "bb4c437c-47a1-4039-be22-55797f44515e",
    "department_id": "f3821d2b-c012-409b-b288-b7b815bd0ce6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "e147e70b-7b59-4c96-953b-e840a012cd48",
    "department_id": "667418d2-790e-47e1-b780-cea0535cee69",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "f598e170-9934-4b16-b320-0f4ed1dfd56a",
    "department_id": "50cdec84-89f3-41f5-b3c5-71a3c47e4fd2",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "f6bc80b2-a085-4af9-8db1-2e266254a51c",
    "department_id": "c42eb7bc-31c8-4aaf-af30-be36df0e31c4",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "c593bd85-80e1-4700-92d7-454c80ca102c",
    "department_id": "9124b249-b5d7-454f-933b-a621b40f2e4e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "95f3f8b4-a4af-4e56-ad55-e782ec912833",
    "department_id": "de4aa189-fba2-4842-b83f-3258d54a1340",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "c7fce956-1f76-46f8-bd3e-2bded882faa0",
    "department_id": "5580330b-5fa3-47d8-84c1-8cf589e410bf",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "fb9faaa9-911a-4730-a0ec-60fc9696c444",
    "department_id": "5c5c8c50-d06f-4d8f-aa64-512a76a1aa0f",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "af2321f0-cc93-436e-a65d-c50dd8e7dab1",
    "department_id": "ee1b294c-0bae-40b0-a5a3-46b1230517bf",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "5d2250e2-6073-48ed-a4a8-512a1ff90921",
    "department_id": "d3e09725-e53d-4947-8502-ba74dd836876",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "353df619-9d68-4015-8b99-8741d3fc1677",
    "department_id": "3d87f153-54bb-4738-9910-be8668a99baa",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "222b3104-84d0-4b2f-997b-13c6be3f8970",
    "department_id": "0f98439d-4220-46bf-846b-3689b020854e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "d1ab8abd-a40a-4d20-8fa5-fdd5afb2e617",
    "department_id": "5c043e79-6acd-49de-af6e-00fbf67d6e34",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "f85bf003-6011-41df-ba92-670dad74d23c",
    "department_id": "3cc21a46-06d0-46e3-99b2-0988a15cb1f4",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "35a8e88d-e221-446e-ab00-d783d785df5c",
    "department_id": "ad833830-8b32-46ea-a9d2-3e6e5219d747",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "848332b2-3d59-4715-b8ca-09923cb19407",
    "department_id": "cc2c5d68-d115-440d-8d88-2fdf5c82f394",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "6d53835d-2c3b-4b6d-8ca5-c638f1a492e4",
    "department_id": "249c35a4-17fb-4c23-a074-e4ca7a584cfc",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "26b0ff90-859d-4326-a2cf-8ff283df6002",
    "department_id": "d883711d-039f-49bf-981f-3c283600e697",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "0c14c35e-a412-4d84-951c-a7907864f022",
    "department_id": "2bb5fd82-e5ad-46ae-b769-3d1a8f3535db",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "549a4287-f290-4e79-a009-381334fa8a96",
    "department_id": "ceeaed66-bf35-499e-9497-8cdc689444e6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "a46f3097-ea7e-4e5d-93dd-a06929a46e55",
    "department_id": "4635244f-4bab-45d0-a0a3-0a55a639f196",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "fd808aed-dfde-4956-ab5f-76c73f2812db",
    "department_id": "a9c3365e-72c2-4ea9-af74-bcc17d53372a",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "e40b01b4-6c7e-4037-8c17-098485d08575",
    "department_id": "f900ec42-d48a-44ef-a94b-3c9cd4c28124",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "47384450-b5ae-47bf-b202-5f7ea08da73e",
    "department_id": "975cdfc5-3978-474c-94f1-0b29992fc0c6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "afd1074c-fc82-4378-a4e5-2cd3f1421d65",
    "department_id": "501e993b-a036-4650-adb1-a58b986a1fd7",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "8c36f48e-4d00-4695-be0d-31ee27e4929e",
    "department_id": "7139477e-3ca2-4878-9d8c-7c3234f29034",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "8823d6f5-508a-49ce-b4f5-922b9aca310d",
    "department_id": "56ef12fa-a98c-425e-b803-f903a464af5e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "76460f87-c5bb-4467-9295-f15e8b3b32f8",
    "department_id": "22af8c34-5e5d-439c-a6fc-a088f609b125",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "98ed4c62-7320-4c9a-b780-2b467f93d7f9",
    "department_id": "85eca5f4-0ac2-4e8e-839c-30b72cccbba6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "8253fdfc-03d9-45cb-950a-bedb84faa96b",
    "department_id": "73c3d6b4-a2f5-45f3-9d6d-01b20cd1fc7e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "3f618495-14d5-4b02-8548-1f814ad4dd24",
    "department_id": "cce044d7-eab4-4652-931a-c0dfaf7bb4e1",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "d9463d5e-ab36-4b5b-89fb-cc40af29fc5a",
    "department_id": "429444ad-4615-4637-ac60-e1725f225b7f",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "bc380b01-5e3a-44e3-8c4f-30958d4f6cbf",
    "department_id": "674160ce-5053-4c18-96e7-eea7dc74921a",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "d8c5f4e6-86cc-45af-876b-f2c27556c7ee",
    "department_id": "5de50c5e-3f4d-4e28-83cb-dd4aa5a4d19a",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "7be5bb22-9732-45ed-bf26-45f2415217ab",
    "department_id": "e9f756da-9cfc-4aa2-ba75-5ae3dbeb2351",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "2c475fd1-c874-48ba-970f-c552f3982471",
    "department_id": "60dcb668-2945-4c36-9572-ffea17f04c65",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "0e32144d-00ee-4bb9-8cef-0b2ca2da34ba",
    "department_id": "481b3c3b-02e4-4011-8e8b-e782dddbc19b",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "42403952-cbce-425e-8bff-3ceaa4688119",
    "department_id": "652a6d57-53cc-4adf-ad5a-5dd1d7a2d271",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "048dae90-f0e1-451e-a2ee-97378fa47e0b",
    "department_id": "3b2de3b7-070f-45aa-bf5c-5ca5834be202",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:39.160671+00:00"
  },
  {
    "id": "6fcbb984-e400-4e08-8197-f550376b92fd",
    "department_id": "858d7677-6673-472a-be88-4cd8169543e3",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "465beb09-afcd-4828-bcd9-33931bf65b43",
    "department_id": "3ec7f283-6ed1-4e17-8729-7dcefb85aac6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "19913bd7-2de7-4ea8-b815-ce415a11f5c1",
    "department_id": "3b677a48-fb0c-4cc5-a5e9-a90908454fa6",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "dbf4d64a-848c-4e89-8b43-89f9857ec002",
    "department_id": "c49677e2-c1c4-4926-8323-120a3693fe77",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "b4bfa1d0-ca22-4620-9ac2-fddcbd7af1c4",
    "department_id": "9b800552-fcc7-4aca-bab9-9e9bdc1618c1",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "9692bfa9-ab83-4d7b-9fe3-e2a6d2a79d1f",
    "department_id": "77585fd0-508a-404b-bcb2-58c151c99fcc",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "6a4b3efe-a232-4e1f-8c5f-6a548ba35700",
    "department_id": "6d1a561c-bd46-451b-a385-1463ce16bbb9",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "dbfdb3c5-16c4-49be-8c4d-87f51433149b",
    "department_id": "6133c916-d438-4ab5-ad8c-976df1cccebe",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "c75d9bd4-24b9-48d4-b062-ca89d38f2f2b",
    "department_id": "94dcf306-b0d3-4410-9b09-db7ff6c49f15",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "0f6c8261-2547-4e22-9d8d-5f680599116e",
    "department_id": "b536f10e-ed19-47f4-a6a7-b19d39736715",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "0e3335e8-0a02-44cf-92b3-495920065329",
    "department_id": "4c59d98f-5f43-4eb9-b507-afaab1b8a12b",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "1a577fb5-1ac2-48fb-8651-c083a36e4977",
    "department_id": "58578c78-38f7-441f-b71f-87e1dee7c04a",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "f91af165-ed57-4fd4-afa1-6cffbf9407a8",
    "department_id": "14cbe224-5a00-4ab8-9c40-6dd22f33a747",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "fe063528-e93f-4bec-814b-2d9e4d03cc94",
    "department_id": "60c3b366-a794-4ba5-ac02-f3e15be2ea4f",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "79ec8742-1e9e-4089-bfbb-d6278b885d3f",
    "department_id": "33c6aaed-63c0-465f-8608-3da4df8cfc91",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "8fee1aa1-d8bd-4ebf-97ee-12e984c9ed1a",
    "department_id": "e77b8c4a-ec42-45dc-b513-ad33a5329d8f",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "30526114-39bd-4a92-8d49-2fd6d1bc505d",
    "department_id": "8d458a1b-c28f-40a4-9be8-84f6c2e58b11",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "9ecabec3-0573-46ed-9d3e-93a51e59f33d",
    "department_id": "4687cef7-544f-488c-8976-300fb0a5f67e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "917420cb-af07-4b5a-8497-ff774e037f4b",
    "department_id": "da081e85-f648-45d1-8938-94d9b53d1190",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "ab0157c2-80f5-4258-8132-3f7c42d040b5",
    "department_id": "dca47b11-8a02-4cc0-981f-671896fc3692",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "8794ce99-f667-4f5c-aa2a-3df4ef3c45f7",
    "department_id": "d3fe33ea-d836-4172-9030-0dcb5be6f573",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "f88e7f54-39e8-4526-80f0-547881a497e4",
    "department_id": "c0f77174-9c35-42b1-8e63-a95a9afae25a",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "941aa569-e1a8-4e92-8fd5-04a17531e848",
    "department_id": "62a9155d-a40c-4253-9809-c243161a89b4",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "6114c7a1-aad1-44b1-97d5-adcf3bbb4e48",
    "department_id": "9141d4dc-63ab-4deb-b1a3-dedb3af0da5e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "89e98a49-536a-43e6-ac7e-b96fced54af8",
    "department_id": "3b3e5a1a-a94d-4382-b51e-18ae6096b9d3",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "d6a75d8c-06fc-4a17-8079-6d22cf4419c0",
    "department_id": "06298975-62e0-45ea-8388-30b05e5c35eb",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "f3a00285-4cb0-4455-8389-97f67b2ae6e2",
    "department_id": "2a3fab1c-034e-45f4-bef0-60fb1c23977f",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "7df2cad4-e9d7-4664-ae7b-9526a86057b8",
    "department_id": "c6baca87-beb6-4283-8f67-aa0236644b91",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "cd082825-20cb-41a8-8a96-0b4e0c5e0c23",
    "department_id": "66b6c510-72cc-426d-8d8b-8e738d47b12d",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "31433058-e82c-4711-a3e6-32372e9f1b04",
    "department_id": "f56f5a42-b5f8-4c72-8363-032faa39600c",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "8c8f0a66-6a39-4e04-9172-d1ad01dd5295",
    "department_id": "adc7363e-7702-4616-a277-98f24576b441",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "ed908b5b-0e84-47b9-91c5-79125d21d56f",
    "department_id": "1f9afc7a-12bf-4745-9f58-292a8d4a8a61",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "af327c90-6900-4225-ac64-660d154c43be",
    "department_id": "39ede850-015b-4ee6-a6a4-d7f837a5c50b",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "bd62d291-4a01-4822-ad20-1793952196e4",
    "department_id": "fac957ec-8628-48af-9c4a-012bf970a1e2",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "2881a77d-7ff6-485a-af56-ba24601b9208",
    "department_id": "5bdc8884-2445-4663-af8a-e42219f18ac7",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "727cfc36-0952-4c33-8b3c-2190b1b6cc73",
    "department_id": "78b18e20-da8e-4ff0-86a2-5e9d46e113e2",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "a91e08aa-cbb7-47b8-9a8d-7edec8aac150",
    "department_id": "0a3897ce-2402-4167-9ee5-ffafbe875be2",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "8de5b5bc-1ec2-4f4b-a849-65a9b53398d6",
    "department_id": "d8d64710-423d-4158-a054-857f4694e70d",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "9a228336-78b0-4536-9c52-7f1003beb280",
    "department_id": "fb949836-12d6-4a29-886c-5ddcd928fc68",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "c85de9db-3d09-491e-84b2-40d2f7996ccd",
    "department_id": "564d9526-8f95-4238-8c9e-1f6ec7fe6a00",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "03ea1879-4969-428e-a5d2-88b69295ab3a",
    "department_id": "66510648-c56a-4c36-9af6-0e0865ad325f",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "e4dd9a71-e788-417c-82ce-7d0353d200dc",
    "department_id": "06dde63d-8e41-4101-9d6b-170d49731afb",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "ebaca755-bfce-4358-a923-5f2c960658d2",
    "department_id": "0431ce35-419e-4fc5-8ad2-643fe9b1ff30",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "252247af-253b-489f-9023-711b5bd258f6",
    "department_id": "00f23b94-b51d-438d-b6fd-257e4ded39eb",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "f34717a9-cc0a-4fc1-b14e-c725a5c1d036",
    "department_id": "5036fee2-7f17-4e86-8297-ee4401cd976e",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "6fe3d604-580b-4b59-8f87-c99768322862",
    "department_id": "58fa2e1e-9ed6-4465-954d-aee142622ec1",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "30c26bc5-22f9-4629-88d1-8ca4e5f5ddae",
    "department_id": "991a92fd-33f7-44be-a01e-aa9a5e8e3ac3",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "4f1c1e6c-c38a-4eaf-8d2b-9b0eace37626",
    "department_id": "0247b6c7-bfb5-4708-8991-589427a9d5b9",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "7ab1c7eb-45d3-46ce-9c87-cafb50952d77",
    "department_id": "e72d7705-a1a0-4ddf-af95-54aeb0e59685",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "779b0b39-2265-48e4-9380-81bbd74f848a",
    "department_id": "514c7b18-bf75-432e-b83a-d250347f91bd",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "2942b33f-c533-40cc-86ba-53ebc81a4489",
    "department_id": "8c334237-e6c0-40ef-96fa-99e9064cb28d",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "53a0dcbf-06a8-40ee-91b8-ee1c19ca08f3",
    "department_id": "c25fd5fb-3690-4ad9-bdc1-c010b6b564da",
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "ff53ad46-01da-4c01-aa34-ad4da04de792",
    "department_id": "ea48df2c-b632-44ca-9bf7-ac8cb16f2f52",
    "name": "Certificate in Theology (Hindi)",
    "code": "CTH-HI",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:42.991935+00:00"
  },
  {
    "id": "3dd4bff2-79df-4b67-931d-6f966dafd12d",
    "department_id": "b4255c06-6288-4077-8a3c-f17c0f13d59a",
    "name": "Certificate of Theology",
    "code": "CTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:41.316676+00:00"
  },
  {
    "id": "97e48f22-4df8-48b4-8182-056ca1a4c7da",
    "department_id": "c42eb7bc-31c8-4aaf-af30-be36df0e31c4",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "3daeab26-20be-477a-a6e1-89ec5d394ebd",
    "department_id": "9124b249-b5d7-454f-933b-a621b40f2e4e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "cbfe4d76-e62a-487c-ab82-1ff5e1c404d4",
    "department_id": "3afb6467-7a73-4479-bc83-d050435d9e71",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:44.066785+00:00"
  },
  {
    "id": "f693b35c-6152-4335-8381-7893591bca67",
    "department_id": "39ede850-015b-4ee6-a6a4-d7f837a5c50b",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "5b9b3144-1032-4112-b62c-8288c8ae245e",
    "department_id": "41805d2c-684c-4ae5-a5e2-32b1c1fdf898",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "342539ea-065e-4b05-b61f-d2e6e751bb24",
    "department_id": "50cdec84-89f3-41f5-b3c5-71a3c47e4fd2",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "b82fc13e-8874-4743-92fe-959a162f34fd",
    "department_id": "5580330b-5fa3-47d8-84c1-8cf589e410bf",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "43a0359f-0754-465d-95c3-46eae8118ae5",
    "department_id": "de4aa189-fba2-4842-b83f-3258d54a1340",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "27259472-c9ba-4f6a-8018-e85e5c18aabd",
    "department_id": "c5bc5c63-e83c-4662-95d3-aa554e767a31",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "10b79381-4dca-41a1-a00d-579092a89308",
    "department_id": "401df322-3ff0-417c-8132-292b6d969e72",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "87d069a5-5dc3-4d57-8b36-4ebb6330d653",
    "department_id": "ee1b294c-0bae-40b0-a5a3-46b1230517bf",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "e935cb04-682c-433d-99f2-07d2955e089c",
    "department_id": "5c5c8c50-d06f-4d8f-aa64-512a76a1aa0f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "1945f614-2875-4fed-8afe-fd35f5e6f04d",
    "department_id": "5ec29532-0774-4499-ac65-3cd140968b46",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "5a562b20-8c97-4b64-9887-b1e35c97aa81",
    "department_id": "757f3fd2-1e47-4d94-a1db-dee21a44b304",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-04T11:50:52.5796+00:00"
  },
  {
    "id": "e98dd3c4-95d3-4af3-b343-53f773978304",
    "department_id": "3d87f153-54bb-4738-9910-be8668a99baa",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "e1918ab8-22c3-4bc0-8c39-223090fed351",
    "department_id": "0f98439d-4220-46bf-846b-3689b020854e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "dcd9f3e7-bbd0-4ed6-96f2-44e3b24e5548",
    "department_id": "fac957ec-8628-48af-9c4a-012bf970a1e2",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "d2730c9f-410f-4b4a-bdb3-5d856f9c6764",
    "department_id": "ceeaed66-bf35-499e-9497-8cdc689444e6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "018a355c-f861-493d-83a3-8e34db113a89",
    "department_id": "d3e09725-e53d-4947-8502-ba74dd836876",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "c359cf67-5824-41a7-9b82-bbabbea277bd",
    "department_id": "5c043e79-6acd-49de-af6e-00fbf67d6e34",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "c76d79fa-4f87-4e3c-aaf6-356445579f5b",
    "department_id": "5bdc8884-2445-4663-af8a-e42219f18ac7",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "bfcb7858-6b57-4b44-9755-2620b2b791d3",
    "department_id": "95899934-1e17-4e12-b4d7-def27341fcf2",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "dea2b27e-2c4f-42a6-b77e-349e5c35a8c8",
    "department_id": "53c57571-42d4-441a-bb45-d950350baa9c",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-04T11:51:01.05816+00:00"
  },
  {
    "id": "ae66163c-6c5e-41e6-8463-f85f8eb4be0b",
    "department_id": "714de06c-b22d-4c69-b1b6-a8ba89618046",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "1d89f9ec-da9a-494c-a503-9ee361cc9a8c",
    "department_id": "ad833830-8b32-46ea-a9d2-3e6e5219d747",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "637b109b-6f6b-4fb8-9efb-daeb481ae8e4",
    "department_id": "0e0fe759-922c-4abf-9945-2e6472dce8e6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "bd7c3100-2194-4f02-9364-8ab27ec294b7",
    "department_id": "3cc21a46-06d0-46e3-99b2-0988a15cb1f4",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "3183a621-6d81-434c-857b-36706ddb3458",
    "department_id": "ed54e04e-b356-4bc4-98eb-01e5f9167d68",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "5bfb507a-8a98-4288-9117-8adfab418c46",
    "department_id": "d8d64710-423d-4158-a054-857f4694e70d",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "4fcb8bf4-d675-4f43-adf7-140da72db5a8",
    "department_id": "cc2c5d68-d115-440d-8d88-2fdf5c82f394",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "b61af0f2-3191-4d13-a82b-2fce669bbd82",
    "department_id": "249c35a4-17fb-4c23-a074-e4ca7a584cfc",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "3c73cc66-b7d4-43e5-ba4a-054c9e8ec99c",
    "department_id": "e9b3d126-b2b0-47ac-908d-3b6896122cf2",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "1d05fd1a-ae8f-4b2f-998e-30d3cfd02532",
    "department_id": "459f14de-a6e7-41d2-8f6a-a1e305e37693",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "85a08ebb-b388-4c32-a6a3-70a0e16b39e1",
    "department_id": "ea48df2c-b632-44ca-9bf7-ac8cb16f2f52",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-04T11:51:01.735983+00:00"
  },
  {
    "id": "af5a5e63-72d6-42fb-be16-68f4bb14eaf8",
    "department_id": "1b53c176-8300-4c5b-a8ad-0d03550c2e09",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "bc99ae11-bf95-479d-9586-ddd3d885afa1",
    "department_id": "4aa3858d-a701-4745-893c-7e1a6fdb1e76",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "d974366b-6782-4c84-afdb-eb250243030d",
    "department_id": "d883711d-039f-49bf-981f-3c283600e697",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "a14ae145-1345-4c26-b982-20da97b806b2",
    "department_id": "e5f140a7-ea78-4387-aa16-7342220622c5",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "dd14b201-ef0c-4638-95f9-84236dcb360a",
    "department_id": "9ae71be5-a9b8-47b8-affb-fd6f486957df",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "66c2b7e6-644f-4e9c-a438-ff7cc81dc1b0",
    "department_id": "2bb5fd82-e5ad-46ae-b769-3d1a8f3535db",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "042fdec7-5a59-4bbe-abd9-8ee208f75f17",
    "department_id": "4635244f-4bab-45d0-a0a3-0a55a639f196",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "fa993d2d-2f52-4caf-b3b0-73daae9eb637",
    "department_id": "78b18e20-da8e-4ff0-86a2-5e9d46e113e2",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "ce83b050-77f9-482e-8d89-e8e4c871623b",
    "department_id": "975cdfc5-3978-474c-94f1-0b29992fc0c6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "108ecc68-c0a1-4281-94c9-53696a5457cb",
    "department_id": "fbf81e28-40b2-48f5-a60c-634eebb06522",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:44.9646+00:00"
  },
  {
    "id": "f200acf1-131a-497e-ac4f-fd6e7e8ff3ab",
    "department_id": "0a3897ce-2402-4167-9ee5-ffafbe875be2",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "1852e42e-2b5a-4014-87e2-e2768d13b96b",
    "department_id": "a9c3365e-72c2-4ea9-af74-bcc17d53372a",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "117e3f9e-f57e-4e2e-bd32-ed9c8bb5dee3",
    "department_id": "f900ec42-d48a-44ef-a94b-3c9cd4c28124",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "0ae07745-0215-4002-ac40-166adc8c1c53",
    "department_id": "e72d7705-a1a0-4ddf-af95-54aeb0e59685",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "f347cc48-229c-4d50-82f7-7e8f3c8b80b3",
    "department_id": "9fad4dd5-55b5-440b-b59f-899a1eaa6b15",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "a15794c9-fe36-4a47-8af9-03f569a33b70",
    "department_id": "501e993b-a036-4650-adb1-a58b986a1fd7",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "29ac3931-267a-480f-a16f-1b335d2488f9",
    "department_id": "b7c6741f-e4dc-41af-8b9b-ad23d961627b",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:44.365189+00:00"
  },
  {
    "id": "dbbf39e6-bfab-452a-84b1-7f28650d6f89",
    "department_id": "ba37e1ce-3772-4bc6-990b-de7ac00077af",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:44.209666+00:00"
  },
  {
    "id": "7a0b5f2a-f7bb-46ba-9361-d6844fdcd356",
    "department_id": "7139477e-3ca2-4878-9d8c-7c3234f29034",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "123a7cf4-5046-4faa-9ddd-b00211f90455",
    "department_id": "66510648-c56a-4c36-9af6-0e0865ad325f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "4f3190ea-9139-4e2f-ac47-0402f73ffa67",
    "department_id": "e5069693-214c-450b-96ed-57dbdd56d652",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:43.912334+00:00"
  },
  {
    "id": "bd72bb61-31e1-4e51-9c3f-29c12d87bf7b",
    "department_id": "558cd616-e509-4e02-b043-8ecf82b009f9",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:43.75616+00:00"
  },
  {
    "id": "0a803497-b9c9-4c00-9f7b-a73d81e3f6e2",
    "department_id": "d56fc6ac-2a22-4741-b62a-a0c9171bfe6f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:43.336056+00:00"
  },
  {
    "id": "de53a18e-0295-4c80-b145-de0de817060f",
    "department_id": "56ef12fa-a98c-425e-b803-f903a464af5e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "eb01663e-6317-440d-9cfa-aef15a7617b6",
    "department_id": "264843fa-a9cf-4864-a434-32935e4ab6f5",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "e94aa360-0f4d-4956-9919-fd80294fa705",
    "department_id": "8e059ed7-1714-4d8c-8d68-d023520d988b",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "96877692-df31-4a5a-a4e4-cf9cc5d432e3",
    "department_id": "22af8c34-5e5d-439c-a6fc-a088f609b125",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "84383403-a596-46cb-9f55-4bc4cba45c54",
    "department_id": "85eca5f4-0ac2-4e8e-839c-30b72cccbba6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "23d9e6d8-6df6-442d-83a4-b7a255ae1b14",
    "department_id": "6043efae-c19f-404f-8181-deea084dcee1",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:39.014696+00:00"
  },
  {
    "id": "024edf08-fc5d-4332-baf4-a5a5fcf68426",
    "department_id": "ad932cf0-e664-4495-a6f8-5e000aaf339b",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "c6d1be2c-600d-426f-a656-30be9373230b",
    "department_id": "5315f616-77e2-4abd-9e8c-b4b371765646",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "8228cefe-75b8-4431-9f39-285b9e106fb6",
    "department_id": "cce044d7-eab4-4652-931a-c0dfaf7bb4e1",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "91504ad4-6e41-4f37-976a-3c8ff3228c5b",
    "department_id": "564d9526-8f95-4238-8c9e-1f6ec7fe6a00",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "aec1fcc3-2186-4777-a730-5beff3ea200b",
    "department_id": "73c3d6b4-a2f5-45f3-9d6d-01b20cd1fc7e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "c124797e-24c5-4585-b6ff-9f6fa14c5ac2",
    "department_id": "8c334237-e6c0-40ef-96fa-99e9064cb28d",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "3946b078-793c-4cf0-a8ac-ef5c5327dfd0",
    "department_id": "674160ce-5053-4c18-96e7-eea7dc74921a",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "5935fb9a-5967-4816-af13-f8ca123eb2ff",
    "department_id": "481b3c3b-02e4-4011-8e8b-e782dddbc19b",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "0544418b-2bd0-4433-b756-b8298956f01c",
    "department_id": "652a6d57-53cc-4adf-ad5a-5dd1d7a2d271",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "3b6ac846-98c0-4905-89e4-df038664d86d",
    "department_id": "7850604d-4d90-484a-8f8c-1a81058100c0",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "20f985c7-9f91-4f3b-b7b9-ed853282eea9",
    "department_id": "e9f756da-9cfc-4aa2-ba75-5ae3dbeb2351",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "497d2668-0fff-4f31-bf70-966cfdd1c17e",
    "department_id": "60dcb668-2945-4c36-9572-ffea17f04c65",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "bfb10f3a-1103-432f-828c-23e8f3179cc3",
    "department_id": "fb949836-12d6-4a29-886c-5ddcd928fc68",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "78f41c36-4ec2-4e6c-bdce-05d892110aa4",
    "department_id": "06dde63d-8e41-4101-9d6b-170d49731afb",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "e27da8ee-f3aa-41c7-a0e3-70dd1e90f5bc",
    "department_id": "914f3ba0-b33b-40a5-b7b2-76b2a636ba38",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "19a09992-340a-467b-bf7b-3858b4ddec3e",
    "department_id": "858d7677-6673-472a-be88-4cd8169543e3",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "18336bfa-9b85-40e7-b9a8-f183171cee22",
    "department_id": "0431ce35-419e-4fc5-8ad2-643fe9b1ff30",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "0b01afe6-a037-40a2-b4dc-06099dfadd19",
    "department_id": "3b2de3b7-070f-45aa-bf5c-5ca5834be202",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:39.211739+00:00"
  },
  {
    "id": "c2bf13cc-792e-4b6c-8668-3ccb16553a13",
    "department_id": "ae4c6a8c-d5a6-4c9d-8484-5dc41c80bf4a",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "e33329a6-da09-4bb7-83da-19009d9197b2",
    "department_id": "3b677a48-fb0c-4cc5-a5e9-a90908454fa6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "2c7e2d94-b314-40a5-aabf-9ca7ed844e70",
    "department_id": "429444ad-4615-4637-ac60-e1725f225b7f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "4358fc0b-c44c-45c8-a051-76f36d86003e",
    "department_id": "b5e5b62b-53fe-490a-8427-5bcbaef7f07e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "1e50873a-bac9-4429-a658-da3f000dcad7",
    "department_id": "c3d8d41f-cb6b-42d2-9026-339da5b7ffe8",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "b05b11a5-a2f4-4ada-bae0-133b3173ceee",
    "department_id": "9b800552-fcc7-4aca-bab9-9e9bdc1618c1",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "b54be202-0ea6-41c1-9f24-7c7ee39862a3",
    "department_id": "77585fd0-508a-404b-bcb2-58c151c99fcc",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "7ec76ee2-75a1-4518-8b06-b61d8dfe7be7",
    "department_id": "c49677e2-c1c4-4926-8323-120a3693fe77",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "d086eda1-8551-4d13-bff8-12adb7b2a79b",
    "department_id": "2c859d33-056c-4586-b662-ad4159ac78f6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "8e6a95fa-f818-4e24-9d76-abe2cb43a992",
    "department_id": "2dde32a0-2677-405e-a63b-4c6894b1248a",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "b2d01655-d786-47b9-a7ef-2839402a6a27",
    "department_id": "6d1a561c-bd46-451b-a385-1463ce16bbb9",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "4d6b4e41-e249-4dfb-8c25-174fd5315c10",
    "department_id": "6df877cc-2e7a-4da1-93b2-520ed0e25816",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "55e56caf-ff70-40db-be34-bed2c380cf0e",
    "department_id": "248b1121-3088-4fb0-8229-c153973ec662",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "128d05c9-78b8-43f5-af2f-e2e29368cf6f",
    "department_id": "3ec7f283-6ed1-4e17-8729-7dcefb85aac6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "d1d941ee-0e8c-4eed-a280-082b23c0a15a",
    "department_id": "dcf41bf0-37f7-4014-bc59-de9980c647e8",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "c22e6867-6333-4b86-900f-9ac44e14cb9d",
    "department_id": "6133c916-d438-4ab5-ad8c-976df1cccebe",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "6d498ff6-f0ac-47ab-9d4f-eb5c1acad74a",
    "department_id": "1cc2b5e9-e15f-4767-975f-20a8881c9908",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "b678b6ef-e16b-4bf5-a123-cf8eeb24ed6c",
    "department_id": "58578c78-38f7-441f-b71f-87e1dee7c04a",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "4160f629-6067-4f24-8165-ce196e922d1f",
    "department_id": "00f23b94-b51d-438d-b6fd-257e4ded39eb",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "04e69ac7-7b8e-4bda-8a2b-6671569927cd",
    "department_id": "a80c86ea-ba91-4218-9178-2d50e472c303",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "ea42d25a-9d1f-4d58-b6e6-291f4fc0cd08",
    "department_id": "4c59d98f-5f43-4eb9-b507-afaab1b8a12b",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "745ad5e0-692c-4a68-ba41-17dc51787049",
    "department_id": "94dcf306-b0d3-4410-9b09-db7ff6c49f15",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "0f9c70e5-187b-4d21-9bff-0df2a479f4ba",
    "department_id": "e71f8478-1368-48ee-a4e1-95ee0740acbe",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "6c8ab6fa-0bc5-4d7b-95a1-f1c4c9a9876e",
    "department_id": "14cbe224-5a00-4ab8-9c40-6dd22f33a747",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "322baad8-2682-4a53-a353-366d026b648d",
    "department_id": "95062898-a3e7-4262-8964-e2e6b84cf934",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:44.610748+00:00"
  },
  {
    "id": "c00137a1-9c7d-4d69-80f3-3133afc3b42b",
    "department_id": "c6baca87-beb6-4283-8f67-aa0236644b91",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "5b42a42a-bb04-4ae9-9032-c11fd907f120",
    "department_id": "33c6aaed-63c0-465f-8608-3da4df8cfc91",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "76f31048-2465-4fa5-a390-9dd05e4ab94c",
    "department_id": "60c3b366-a794-4ba5-ac02-f3e15be2ea4f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "de7b36b5-80f9-405e-997e-e6a80756bcac",
    "department_id": "4687cef7-544f-488c-8976-300fb0a5f67e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "20fbf330-f498-4502-bb92-b250fa7d763a",
    "department_id": "85527bb4-320c-4f21-8144-c38c3a89757d",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "555f0482-cfc7-4ea6-b1ac-1c7ed66a2ecd",
    "department_id": "e22db4fe-e166-439e-a97f-751547921a04",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "0be3220b-64c5-4655-805d-edc6b2ac837b",
    "department_id": "e77b8c4a-ec42-45dc-b513-ad33a5329d8f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "e97433e9-f1d9-43e1-97e6-41a5324ae244",
    "department_id": "8d458a1b-c28f-40a4-9be8-84f6c2e58b11",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "77a33fdb-f0fa-4585-aefa-d95663fe1a5f",
    "department_id": "0fac5da9-ef57-44e8-909e-c36f485e39db",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "ba2eb3c4-61f0-45f1-9497-ff56a423e17c",
    "department_id": "0c936f95-2ffe-473b-95d6-c6040308ee22",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "d7ab32be-dad8-4cf7-b361-04aa0b2844eb",
    "department_id": "e6dd8d2a-36a0-49e7-bd0d-c233f65f9582",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "17de76dc-3082-4a8b-9324-5d05feaee536",
    "department_id": "a22cb607-770c-48c5-82e9-63727f54983f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:40.054225+00:00"
  },
  {
    "id": "13e31151-6335-4663-91f6-362d0456fe81",
    "department_id": "da081e85-f648-45d1-8938-94d9b53d1190",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "ab1fd38e-197c-43ba-ba2d-ebbeb7e9b21c",
    "department_id": "5036fee2-7f17-4e86-8297-ee4401cd976e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "be81ee21-c96b-4865-a9d4-fbe34a242172",
    "department_id": "d59db4af-dcb6-453c-9ae2-fea8524a1f25",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:43.231956+00:00"
  },
  {
    "id": "730135c9-5715-4ef4-ace4-8e8f147d098a",
    "department_id": "c1010ebb-8461-4a0a-8a92-806944d99103",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:40.243634+00:00"
  },
  {
    "id": "76259993-a4c8-4f54-9324-788fc15308d0",
    "department_id": "c0f77174-9c35-42b1-8e63-a95a9afae25a",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "0209199c-2154-4886-a55e-f9c77a70856b",
    "department_id": "e6348261-d09b-45a1-8e3e-cfb4361e219b",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "0ea87de0-a857-45a9-bde7-20ea8b6838dc",
    "department_id": "d3fe33ea-d836-4172-9030-0dcb5be6f573",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "c0a19794-9364-48ce-abde-607712e46e0c",
    "department_id": "dca47b11-8a02-4cc0-981f-671896fc3692",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "8ec67723-1403-4643-8a7f-e2bcb8e0e9f5",
    "department_id": "5de50c5e-3f4d-4e28-83cb-dd4aa5a4d19a",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "2a658c69-e403-48fc-9b5f-010780841187",
    "department_id": "c25fd5fb-3690-4ad9-bdc1-c010b6b564da",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "54da19b4-3c41-42b7-86e1-cfacba206f7e",
    "department_id": "62a9155d-a40c-4253-9809-c243161a89b4",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "9c92f3d5-e1e3-4695-a7ff-2030447c0be3",
    "department_id": "9141d4dc-63ab-4deb-b1a3-dedb3af0da5e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "5867b14b-8d8a-4c5c-acb2-a1990aa2979a",
    "department_id": "58fa2e1e-9ed6-4465-954d-aee142622ec1",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "6c979ce9-d371-4899-a76d-8adec8d80474",
    "department_id": "06298975-62e0-45ea-8388-30b05e5c35eb",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "cfe2e803-5963-4008-9eec-18ad363f51e4",
    "department_id": "7fb084bb-b3a0-41fb-8d86-8f5c03ba8ff3",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "4736deb9-a865-49fe-92c9-7ea32ae48614",
    "department_id": "3b3e5a1a-a94d-4382-b51e-18ae6096b9d3",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "88cb31cd-bc40-4fde-b78d-ffb86bffd5c7",
    "department_id": "b536f10e-ed19-47f4-a6a7-b19d39736715",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "44920587-7cbe-4367-9d96-55c7af02a8ad",
    "department_id": "c7eddd25-fd68-40ad-bb9a-b0f46fe891f0",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "9ebb1a7f-912c-44bf-9cbe-9e7b90c4bbdc",
    "department_id": "f736b665-41d4-4898-b887-5b00708ca3f5",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "9f75518c-356b-44cc-bbb8-ae4be6949d12",
    "department_id": "e0e63fc4-256d-4941-9df8-d5d1e47b2714",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "915c5934-777b-4806-95b7-c18c211d7fe4",
    "department_id": "2a3fab1c-034e-45f4-bef0-60fb1c23977f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "c5234b6e-eabd-4888-acb5-f2e9270546fc",
    "department_id": "991a92fd-33f7-44be-a01e-aa9a5e8e3ac3",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "ca7e4a80-fccc-492e-8fa4-b0c8c5117cb7",
    "department_id": "eb6d4422-3aa3-4268-9071-991a22b1792f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "1d8b87a6-8152-4029-a3a4-d695cf8a6011",
    "department_id": "e51ce36a-1d05-4376-91f6-ad90e437b8a7",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "a667a0e0-fa5c-4f61-b4b1-c555dece3a09",
    "department_id": "0247b6c7-bfb5-4708-8991-589427a9d5b9",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "0a8c0056-1cf1-4f6b-9ccc-eecf93da90c6",
    "department_id": "7fc3f679-29b2-47bb-924a-1f089f28dbf4",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "f759c3bc-3abd-4f45-a2b9-65099c343d11",
    "department_id": "052ddb0d-d547-4e5a-8192-74bd79ab6300",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "b072519f-c192-4744-8666-b05568b61bde",
    "department_id": "7289d7b1-df7a-4fe7-a2ae-cd55c9bd29ce",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "0da8344e-f451-400e-bf33-e0d143aa93d3",
    "department_id": "1286f06b-ff2c-4a08-b224-01668f6a260d",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "45d6f952-63eb-44ef-839b-cc69aeaa2acf",
    "department_id": "55e70d0b-5403-4fc5-ac13-eb98f1f87801",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "e1eb2700-e93f-45a9-b4cb-a5d34547c6ce",
    "department_id": "3d0fdc3e-8dd6-4536-8df3-786a622ab87e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "824fd68c-ce14-4807-b526-01fca5f318e0",
    "department_id": "b45d0a72-5f8c-405c-a715-8293b3b4dbf6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "09010030-8cff-46e4-931e-966ac0af165a",
    "department_id": "e01d5da2-91d2-4758-b95e-acd2b55eb8ba",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "11e76b56-299c-4da9-90c1-b1f58bb147fe",
    "department_id": "b2f8e57d-04b5-418e-88f5-c7cdb6f26c4c",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "82a0b120-040a-43b5-b005-33a53e73a427",
    "department_id": "2c161351-11a7-4457-a9e5-37f517d3d444",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "6899d268-1752-4235-aeca-82e43157efbd",
    "department_id": "f56f5a42-b5f8-4c72-8363-032faa39600c",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "078380c9-c6bb-4ebc-951c-1b3a98dc5f22",
    "department_id": "adc7363e-7702-4616-a277-98f24576b441",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "3465a918-5b8f-4b46-83b8-14e6066d6d92",
    "department_id": "2bbf45f1-6345-44c9-8bed-e87096f3bd80",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "fa0f0ddd-c5f4-4c18-a5e3-aa305830e012",
    "department_id": "7cc69375-a30b-4c37-9d72-55b986b6f69e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "2a3c909f-75dd-4b2a-9845-97d4d00c5637",
    "department_id": "8dae2c63-e0e7-461f-8e20-c278c79d4bd0",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.144502+00:00"
  },
  {
    "id": "cb9eb30d-1cab-464c-ade1-d61e3a8a6aef",
    "department_id": "bf951b67-b4b7-4f9c-8f93-87de50eed8aa",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "d18c5a31-7869-450a-8666-700c50257c4f",
    "department_id": "0bdc2bf1-1eda-416d-bc8b-919b084457e7",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "3d38145c-bdb9-4cff-96c3-0d2985d1f9e9",
    "department_id": "341223ca-c75d-41de-9325-815dc23e79a6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "fefbac35-7aef-473b-ae30-2e3a2e3fc34f",
    "department_id": "436005ef-4ae4-430f-948e-38c7ab5e5b8b",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "b905c341-c7de-4b70-8a5d-cd426724d5e2",
    "department_id": "96b1fd6d-8a74-47b2-82b8-0ac1ad011acd",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "ef111996-1433-4b1b-8690-8a2562a77913",
    "department_id": "0c743554-2d28-4738-a7db-388b3a4a05a1",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.144502+00:00"
  },
  {
    "id": "cf2a366b-994b-4186-a3d9-c8608a386985",
    "department_id": "609074a2-3402-42b1-aee1-2a6dc90b2eed",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "da340ebc-954c-4eaf-96b2-54caa7a545e4",
    "department_id": "66b6c510-72cc-426d-8d8b-8e738d47b12d",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "12957f72-1f63-4658-b164-a7cec2e9c0de",
    "department_id": "a293b125-3bed-4798-a726-ce6fd633123f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "d7dcb4d3-9f5f-4928-a23a-f6a0cc5d2739",
    "department_id": "9f55c64e-6eee-428d-8886-54b0ab0e1e8e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "d65900c4-df78-4b65-b40b-0e10e7bd3e94",
    "department_id": "eabf2251-c8b2-4b40-9516-04d447cfbc77",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "cf04a377-4015-40bb-856a-f204783d42e9",
    "department_id": "860acb81-c65f-4f98-aa21-49a22409d78f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "644a8343-1230-49c2-9bbb-8002f3160ec7",
    "department_id": "d1cc0cb1-d066-4262-945f-3c6b669ca9f3",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "46cdbc59-796e-4143-b091-1cddaa60c59d",
    "department_id": "3fdeaa03-919b-410b-81d1-3d58b202423d",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "6e457785-2418-46c0-b4dc-64af054c807b",
    "department_id": "4b08487b-059e-4496-8bcf-e98d728d14ca",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "06c03bba-af2d-42f1-8fe5-c60aea7292f9",
    "department_id": "4f62d074-d58b-4125-9c47-b5fbf8e6b335",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "af3beba0-17aa-44c0-a778-d449f1f2c67a",
    "department_id": "f3821d2b-c012-409b-b288-b7b815bd0ce6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "dd8e3148-a18b-479d-8816-40acfceeea38",
    "department_id": "97d961bb-3a22-4d55-a813-f08d09e283b6",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "c9738229-0053-4b54-95cd-b013850aa090",
    "department_id": "4452e861-be19-4d8d-9952-7859ef3c38c5",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "6760888d-88d7-43f7-beed-b39bbe8150fc",
    "department_id": "e151fa82-1c7a-4253-9ecb-6eb0be01e843",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "1f273362-ef58-4a6d-8681-ccb1203c1550",
    "department_id": "642b6c16-d6a5-46b5-941c-f90081df78a9",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "35042696-8264-4734-a55a-f7ec80c9aeb2",
    "department_id": "b3b039d0-2908-4a1f-b87d-be4625f4388e",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "5289c131-a172-49d6-9486-a373237712e9",
    "department_id": "1f9afc7a-12bf-4745-9f58-292a8d4a8a61",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "7026c269-c04e-4773-97c9-78b9232f8eb5",
    "department_id": "16fd3961-f242-4f2f-80a4-86f858421fe9",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "c6cd0b40-b383-4ea1-b94a-ff590d04c7b9",
    "department_id": "9bd047ef-b722-407a-9916-473c8e24d100",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "fb6a806a-992f-415e-8efe-db5a2feccaf8",
    "department_id": "7a7b083e-e06e-40ee-b9b5-e864c8307a74",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:44.463587+00:00"
  },
  {
    "id": "2d2ba731-6e67-40eb-b1f1-6c969ac07a34",
    "department_id": "514c7b18-bf75-432e-b83a-d250347f91bd",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "3358296b-8d42-44bc-afb4-4b3f2e868860",
    "department_id": "298a101d-74c7-4b09-b416-b219f51d0b15",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "58d77d66-c4a5-46c2-bd75-1f09a1448695",
    "department_id": "e12e7010-e492-4f7a-aad2-8418dd59661f",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "c5d180b5-79a4-4837-8dec-09b7f1a27cfe",
    "department_id": "c1200c7b-ad94-4706-ba06-e2310e2cda4a",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "f187b305-c306-4a85-a18f-b9b7c1106c3a",
    "department_id": "8da7d80a-eca1-46fe-89d8-83c8ab92d5b3",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "13e7b828-65e1-4eef-b327-0267ef9b2bce",
    "department_id": "667418d2-790e-47e1-b780-cea0535cee69",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "ffd17928-61a6-483b-86b3-53c6b6f6d57d",
    "department_id": "4124db1b-9d20-4bb7-99b2-935078f8c7b8",
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "c7679074-899a-481c-9bdc-b41c975963ee",
    "department_id": "693ece13-75e5-4240-97b3-99da70915a40",
    "name": "Diploma in Theology (Hindi & English)",
    "code": "DIPTH-HE",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-04T11:50:58.959475+00:00"
  },
  {
    "id": "d2063ba2-48ae-4197-8b52-29cbee21f92b",
    "department_id": "ea48df2c-b632-44ca-9bf7-ac8cb16f2f52",
    "name": "Diploma in Theology (Hindi & English)",
    "code": "DIPTH-HE",
    "degree_level": "DIPLOMA",
    "created_at": "2026-09-06T07:32:43.037567+00:00"
  },
  {
    "id": "8d49cd83-8552-4d0e-8375-0d0482331349",
    "department_id": "9124b249-b5d7-454f-933b-a621b40f2e4e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "7a0d81b5-d5df-4f95-a401-782258a219a0",
    "department_id": "c25fd5fb-3690-4ad9-bdc1-c010b6b564da",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "8c5b735e-9685-4d1d-886c-2613cf21bba9",
    "department_id": "8c334237-e6c0-40ef-96fa-99e9064cb28d",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "4c8e9154-80f6-41f6-9b37-6dafb68efa5d",
    "department_id": "d3e09725-e53d-4947-8502-ba74dd836876",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "1a5e5db4-8ac1-4b4e-8bc9-8045f1e050bf",
    "department_id": "8da7d80a-eca1-46fe-89d8-83c8ab92d5b3",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "da08a160-41d4-4402-8ba3-3b2b68226dde",
    "department_id": "41805d2c-684c-4ae5-a5e2-32b1c1fdf898",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "c38f4d16-a8ff-42e8-8a83-b5ce2c4d790a",
    "department_id": "4c59d98f-5f43-4eb9-b507-afaab1b8a12b",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "b7b0dc20-b026-45e8-a6eb-10cc96d02ae2",
    "department_id": "00f23b94-b51d-438d-b6fd-257e4ded39eb",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "b3a70abf-3921-4451-b2d8-ac6f5ef2e8ce",
    "department_id": "39ede850-015b-4ee6-a6a4-d7f837a5c50b",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "fb49ceba-f573-4df9-b961-1824e7628566",
    "department_id": "de4aa189-fba2-4842-b83f-3258d54a1340",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "d5f6c1b0-b128-4fa1-9394-c0dd8c767421",
    "department_id": "2bb5fd82-e5ad-46ae-b769-3d1a8f3535db",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "1461257b-c214-48f0-bcc5-bf38408fc87c",
    "department_id": "8dae2c63-e0e7-461f-8e20-c278c79d4bd0",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.144502+00:00"
  },
  {
    "id": "f3a9b59c-92d7-4929-80ef-065ff9c98328",
    "department_id": "401df322-3ff0-417c-8132-292b6d969e72",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "0792fe84-d4b5-4d3b-9f5d-a5377c54e205",
    "department_id": "914f3ba0-b33b-40a5-b7b2-76b2a636ba38",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "abf3d8f3-a8c0-437d-a1cd-847a4b384a64",
    "department_id": "b5e5b62b-53fe-490a-8427-5bcbaef7f07e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "c237a99c-232d-4fc9-96f3-34fbb4c0dafc",
    "department_id": "3d87f153-54bb-4738-9910-be8668a99baa",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "b3af63bc-8c31-458a-9173-b226a88f2c72",
    "department_id": "e71f8478-1368-48ee-a4e1-95ee0740acbe",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "4c2a4515-88ed-4b0b-8182-425ca685d16c",
    "department_id": "78b18e20-da8e-4ff0-86a2-5e9d46e113e2",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "ba0ac6a5-5d49-420e-8378-f2cdda13e6a8",
    "department_id": "5c5c8c50-d06f-4d8f-aa64-512a76a1aa0f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "c3c85f88-a973-442f-ad2e-57ffe69bbd52",
    "department_id": "fb949836-12d6-4a29-886c-5ddcd928fc68",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "5b1f5153-5a4a-404a-92c4-7735fc93836d",
    "department_id": "4452e861-be19-4d8d-9952-7859ef3c38c5",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "797c23a8-c180-4f60-bd8f-79410243d6cb",
    "department_id": "341223ca-c75d-41de-9325-815dc23e79a6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "090e1b9c-db36-4548-a7cb-5fb961407341",
    "department_id": "514c7b18-bf75-432e-b83a-d250347f91bd",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "ab9becd9-5f5e-4aa1-8983-1e2c582e2b6c",
    "department_id": "95899934-1e17-4e12-b4d7-def27341fcf2",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "4a9ea401-80ad-4a3a-a5e9-ca7a2e9d6f46",
    "department_id": "2bbf45f1-6345-44c9-8bed-e87096f3bd80",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "dbb94c4a-efb3-4f90-a386-99a32a1c2e3b",
    "department_id": "14cbe224-5a00-4ab8-9c40-6dd22f33a747",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "d64d594a-1b23-4d9f-9c58-7785d117afe7",
    "department_id": "58578c78-38f7-441f-b71f-87e1dee7c04a",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "13fb3f70-4f7e-41fd-8b2e-5259a01b0423",
    "department_id": "0f98439d-4220-46bf-846b-3689b020854e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "b7e85560-f4fb-4975-885c-7ea41d46d483",
    "department_id": "ee1b294c-0bae-40b0-a5a3-46b1230517bf",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "c855f813-ed77-4ced-a609-a12af35770f8",
    "department_id": "60c3b366-a794-4ba5-ac02-f3e15be2ea4f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "c634c777-55e2-412f-adcd-c30e62106618",
    "department_id": "58fa2e1e-9ed6-4465-954d-aee142622ec1",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "51ae13d7-563a-4403-9356-971bbb2c4d03",
    "department_id": "4bff2cda-09ab-460c-8dcf-e313d9e65176",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-06T07:32:41.813173+00:00"
  },
  {
    "id": "f1e3f523-6e2f-4695-b671-05b35428adb9",
    "department_id": "0e0fe759-922c-4abf-9945-2e6472dce8e6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "9b00337c-ff6e-4001-9a21-98621fcb9d4b",
    "department_id": "3cc21a46-06d0-46e3-99b2-0988a15cb1f4",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "529e5aea-1fe1-442e-a3e5-7942757a9ca2",
    "department_id": "97d961bb-3a22-4d55-a813-f08d09e283b6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "5ebb4c09-dbd9-4301-bc92-5b59e73c4283",
    "department_id": "642b6c16-d6a5-46b5-941c-f90081df78a9",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "07e2a17c-8350-41ca-b837-af2e94926e9e",
    "department_id": "5c043e79-6acd-49de-af6e-00fbf67d6e34",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "0e12383e-9fd4-475f-8576-c8bda8034e6a",
    "department_id": "714de06c-b22d-4c69-b1b6-a8ba89618046",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "bb5bf34a-b445-43f9-a091-9c4d30888c57",
    "department_id": "e77b8c4a-ec42-45dc-b513-ad33a5329d8f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "2b600fdc-db21-4d87-84fa-a05160a7a9a2",
    "department_id": "0247b6c7-bfb5-4708-8991-589427a9d5b9",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "6b0b248f-9ac9-42f5-95ff-ff13ecfdd80b",
    "department_id": "436005ef-4ae4-430f-948e-38c7ab5e5b8b",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "e97b0c90-b115-48dd-b631-e4f4d1f1dd5b",
    "department_id": "5ec29532-0774-4499-ac65-3cd140968b46",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "bb625e2b-7256-470a-9f00-505ca4bd87d8",
    "department_id": "cc2c5d68-d115-440d-8d88-2fdf5c82f394",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "e54425be-169f-4075-b042-3008d4eeeea3",
    "department_id": "33c6aaed-63c0-465f-8608-3da4df8cfc91",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "a89acfc2-ab23-4aef-b13b-861f1ee25ed1",
    "department_id": "5bdc8884-2445-4663-af8a-e42219f18ac7",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "d07387bf-7b07-4587-accd-12aaa3d61c28",
    "department_id": "ad833830-8b32-46ea-a9d2-3e6e5219d747",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "e30923f2-9348-4c83-ad4a-e8df739efef4",
    "department_id": "f3821d2b-c012-409b-b288-b7b815bd0ce6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "0c88fed2-67d2-4b9f-b0d5-3edbf66b7498",
    "department_id": "b2f8e57d-04b5-418e-88f5-c7cdb6f26c4c",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "fc1a6926-9cac-4f70-a3ea-a7c2827f5f8b",
    "department_id": "ed54e04e-b356-4bc4-98eb-01e5f9167d68",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "3e7cc39c-b245-41ef-af5a-1ac2c8300afe",
    "department_id": "b45d0a72-5f8c-405c-a715-8293b3b4dbf6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "f62360f3-d159-4f43-885c-434916ab46d3",
    "department_id": "298a101d-74c7-4b09-b416-b219f51d0b15",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "caffc395-bf08-4b9e-bbfa-403a22ab4ea0",
    "department_id": "4b08487b-059e-4496-8bcf-e98d728d14ca",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "d7ea74a0-17a9-4434-9a49-a70a02740a7d",
    "department_id": "a293b125-3bed-4798-a726-ce6fd633123f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "2205e0b1-4590-4c26-89ab-e2085c35fa6c",
    "department_id": "249c35a4-17fb-4c23-a074-e4ca7a584cfc",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "cd33f23b-69ce-45cc-b8c9-9c5b4898dd77",
    "department_id": "e6348261-d09b-45a1-8e3e-cfb4361e219b",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "a3bdc8d4-6fac-4690-8a9d-9a51b60c6ec7",
    "department_id": "5580330b-5fa3-47d8-84c1-8cf589e410bf",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "17981d12-cb82-4e71-9a20-40d543877920",
    "department_id": "8d458a1b-c28f-40a4-9be8-84f6c2e58b11",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "485a9f1f-89dd-485a-9607-aaf5e121cbf8",
    "department_id": "4124db1b-9d20-4bb7-99b2-935078f8c7b8",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "d1feef58-eea8-4c29-9984-b3f191635a2c",
    "department_id": "4aa3858d-a701-4745-893c-7e1a6fdb1e76",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "94212120-61f0-4a44-ae1c-bd3a9032c519",
    "department_id": "991a92fd-33f7-44be-a01e-aa9a5e8e3ac3",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "3f14ae01-0371-4ad1-af2e-90f6c1de5611",
    "department_id": "0c936f95-2ffe-473b-95d6-c6040308ee22",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "1e3b981c-89d7-4ea8-8d02-f22adfe131f5",
    "department_id": "5bc255f4-0bb3-48a8-ad6c-234095d2890b",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-06T07:32:40.725133+00:00"
  },
  {
    "id": "762db7cb-6e1e-4166-a7c7-dd81f0f2b9c4",
    "department_id": "d883711d-039f-49bf-981f-3c283600e697",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "9411e478-f083-4cdc-a18a-6dd942850dc3",
    "department_id": "e151fa82-1c7a-4253-9ecb-6eb0be01e843",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "2b94c79c-da4a-4f84-ab03-f962323089b7",
    "department_id": "8e059ed7-1714-4d8c-8d68-d023520d988b",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "e5c179c9-3115-418b-95e9-b41157237cd0",
    "department_id": "c3d8d41f-cb6b-42d2-9026-339da5b7ffe8",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "95f0e2be-97f1-43d4-b4c4-80489382d9c3",
    "department_id": "08b1dfaf-469d-47d1-b093-2b9614af6cf5",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-06T07:32:45.283114+00:00"
  },
  {
    "id": "9f2e9bb2-d2d9-4321-84d5-fc596cbf8d26",
    "department_id": "7cc69375-a30b-4c37-9d72-55b986b6f69e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "af74f350-1c1f-4d4f-9996-f108d2c7232e",
    "department_id": "a9c3365e-72c2-4ea9-af74-bcc17d53372a",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "0b50dc55-02d8-40f6-9744-fd72a30b7358",
    "department_id": "7289d7b1-df7a-4fe7-a2ae-cd55c9bd29ce",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "545f31bb-2383-4e4c-bd86-f239b9832bd3",
    "department_id": "96b1fd6d-8a74-47b2-82b8-0ac1ad011acd",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "965c5e6e-0a44-4969-a9af-581e58a4ac11",
    "department_id": "4635244f-4bab-45d0-a0a3-0a55a639f196",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "b1045217-6413-43e1-82c9-bc4046b11744",
    "department_id": "da081e85-f648-45d1-8938-94d9b53d1190",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "23d1f96c-7ee7-4ac5-9538-9d3b65dd2f3f",
    "department_id": "501e993b-a036-4650-adb1-a58b986a1fd7",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "4021f399-ab7d-4685-afcf-2e711ca5ba20",
    "department_id": "0c743554-2d28-4738-a7db-388b3a4a05a1",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.144502+00:00"
  },
  {
    "id": "e1e7a5ec-0201-42b1-bddb-ddaf5fa5891c",
    "department_id": "9ae71be5-a9b8-47b8-affb-fd6f486957df",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "54c2c71c-06cf-42c9-b275-8ab7da256a19",
    "department_id": "dca47b11-8a02-4cc0-981f-671896fc3692",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "7e9237fd-4259-4154-9ca5-0e6bc7d66871",
    "department_id": "b536f10e-ed19-47f4-a6a7-b19d39736715",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "20eb69cc-f9fa-49d3-86d0-87272fb4df50",
    "department_id": "bf951b67-b4b7-4f9c-8f93-87de50eed8aa",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "6104930f-8ca8-4f1f-9bf1-cbc6b44c5b84",
    "department_id": "5036fee2-7f17-4e86-8297-ee4401cd976e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "d8977eb8-a417-429c-9129-dc421597b32c",
    "department_id": "f900ec42-d48a-44ef-a94b-3c9cd4c28124",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "4a4b7b08-ca5e-48ee-a8ea-2ccd235f1501",
    "department_id": "0a3897ce-2402-4167-9ee5-ffafbe875be2",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "a3650553-5a33-4911-8122-cfd6958fc95c",
    "department_id": "62a9155d-a40c-4253-9809-c243161a89b4",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "b4b1d06b-1ad4-443b-8773-8a3aca6276aa",
    "department_id": "c42eb7bc-31c8-4aaf-af30-be36df0e31c4",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "2e75e42d-d495-4cf4-bb9d-23c04b71edbf",
    "department_id": "adc7363e-7702-4616-a277-98f24576b441",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "5410b122-b5b2-4cc4-aa0f-e5644ba83b51",
    "department_id": "c0f77174-9c35-42b1-8e63-a95a9afae25a",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "e5c9f131-8e72-4bda-b695-8bd980b83e52",
    "department_id": "fac957ec-8628-48af-9c4a-012bf970a1e2",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "dc73da6b-e976-4e4c-ae8a-2489949a4bc6",
    "department_id": "16fd3961-f242-4f2f-80a4-86f858421fe9",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "9ddf2445-412e-4a55-b6c1-a3e02f6d7d91",
    "department_id": "c1200c7b-ad94-4706-ba06-e2310e2cda4a",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "c922a159-ded6-42c1-9673-f4ddf79c2a50",
    "department_id": "7139477e-3ca2-4878-9d8c-7c3234f29034",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "6f1fbefa-5a89-422d-8534-3a6941d0e93f",
    "department_id": "975cdfc5-3978-474c-94f1-0b29992fc0c6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "946e1593-e30a-41f8-86a8-5312252501a4",
    "department_id": "0bdc2bf1-1eda-416d-bc8b-919b084457e7",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "e968c045-b7a1-4509-9947-489780aa0fe6",
    "department_id": "7fb084bb-b3a0-41fb-8d86-8f5c03ba8ff3",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "17d9367b-2698-40d5-b045-72678cf545ef",
    "department_id": "e12e7010-e492-4f7a-aad2-8418dd59661f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "a0941ef1-7783-411b-8e97-d68f20f0d07a",
    "department_id": "429444ad-4615-4637-ac60-e1725f225b7f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "78d58aef-0bf3-47f0-a5eb-2934b4aa40b1",
    "department_id": "22af8c34-5e5d-439c-a6fc-a088f609b125",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "dd3b20ad-1499-4d81-88d3-9a0a9d22a7ac",
    "department_id": "b3b039d0-2908-4a1f-b87d-be4625f4388e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "30378817-9435-4037-93be-4fe63cc7d589",
    "department_id": "e72d7705-a1a0-4ddf-af95-54aeb0e59685",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "966675c9-a446-4970-b228-583bfbe3875d",
    "department_id": "56ef12fa-a98c-425e-b803-f903a464af5e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "c4c3cd58-562c-4fda-a479-7ca985e0a70e",
    "department_id": "ceeaed66-bf35-499e-9497-8cdc689444e6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "03334848-0669-465a-a972-7b34920575a6",
    "department_id": "1b53c176-8300-4c5b-a8ad-0d03550c2e09",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "0f039fdf-b49a-4fea-b240-2dd01beceae0",
    "department_id": "be7351f5-40f0-46ff-8181-c7ca61693930",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-04T11:50:56.342386+00:00"
  },
  {
    "id": "781d71e5-8948-40b3-9d14-4924f06e8c01",
    "department_id": "e01d5da2-91d2-4758-b95e-acd2b55eb8ba",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "d2f6618c-15c8-4aad-99c7-4ac033e06e52",
    "department_id": "9141d4dc-63ab-4deb-b1a3-dedb3af0da5e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "c480e3fd-50e4-42f0-acf3-60b192265d68",
    "department_id": "66510648-c56a-4c36-9af6-0e0865ad325f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "73e5ee8d-8a3c-497c-8d5c-3fd27849672e",
    "department_id": "d8d64710-423d-4158-a054-857f4694e70d",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "5b21a3f6-bdf3-40b6-ad98-e8efba4aee2c",
    "department_id": "85eca5f4-0ac2-4e8e-839c-30b72cccbba6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "5ab91177-65be-42d0-86e1-b19160c07586",
    "department_id": "264843fa-a9cf-4864-a434-32935e4ab6f5",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "4ca6e4c7-4c0f-479e-8c11-72c38c295e99",
    "department_id": "73c3d6b4-a2f5-45f3-9d6d-01b20cd1fc7e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "218ebe21-c73f-4898-b9e8-33ebb753fe0b",
    "department_id": "4687cef7-544f-488c-8976-300fb0a5f67e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "272f7ce0-6b9a-4fbe-bbf3-d2b46fb7865a",
    "department_id": "eabf2251-c8b2-4b40-9516-04d447cfbc77",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "4ef38f38-8452-4a04-8524-b698817791d8",
    "department_id": "e6dd8d2a-36a0-49e7-bd0d-c233f65f9582",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "d28ccf7f-c92b-4151-ba84-e973a03c9a48",
    "department_id": "06dde63d-8e41-4101-9d6b-170d49731afb",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "eccf9250-19d8-4409-aa6e-8e448311cca8",
    "department_id": "a22cb607-770c-48c5-82e9-63727f54983f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-06T07:32:40.105581+00:00"
  },
  {
    "id": "b2b394d9-af5e-451b-9cab-8699d5ac2143",
    "department_id": "248b1121-3088-4fb0-8229-c153973ec662",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "136447e2-6ae0-457c-b984-eb4c7bd87a92",
    "department_id": "cce044d7-eab4-4652-931a-c0dfaf7bb4e1",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "b6a10048-1c35-46fb-b51f-0d787b50879c",
    "department_id": "ad932cf0-e664-4495-a6f8-5e000aaf339b",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "314b15ff-9851-4c87-9d35-453b0c495502",
    "department_id": "459f14de-a6e7-41d2-8f6a-a1e305e37693",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "77083a3e-d3f5-4afa-8150-06437dd0145f",
    "department_id": "5de50c5e-3f4d-4e28-83cb-dd4aa5a4d19a",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "764d0c96-4903-479a-ae83-c55c9e55090c",
    "department_id": "7850604d-4d90-484a-8f8c-1a81058100c0",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "34c8ef70-c24a-44fc-adeb-f8d685485de3",
    "department_id": "1cc2b5e9-e15f-4767-975f-20a8881c9908",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "f87e1ab5-d355-4192-9d13-854f79b5f737",
    "department_id": "e9f756da-9cfc-4aa2-ba75-5ae3dbeb2351",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "1ac79270-0b33-46e3-a8be-df43676e9610",
    "department_id": "3b3e5a1a-a94d-4382-b51e-18ae6096b9d3",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "03f9102a-24cd-442b-af6d-2e4133f7e605",
    "department_id": "564d9526-8f95-4238-8c9e-1f6ec7fe6a00",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "1a50ccaa-c5cc-4cb6-9ed3-849a580f7272",
    "department_id": "674160ce-5053-4c18-96e7-eea7dc74921a",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "b4e6284b-b942-46d4-8a26-54c114388667",
    "department_id": "c194289e-7457-484b-89ee-a0b2ec399d23",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-04T11:50:57.930569+00:00"
  },
  {
    "id": "330a3d86-c1cd-4495-806e-2da2f58ff5c3",
    "department_id": "85527bb4-320c-4f21-8144-c38c3a89757d",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "93aa1fa2-f077-472d-a600-6f96a777ccfd",
    "department_id": "c6baca87-beb6-4283-8f67-aa0236644b91",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "73fd9ca5-7c49-4216-a475-0f54499385df",
    "department_id": "c7eddd25-fd68-40ad-bb9a-b0f46fe891f0",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "e3ef5ef3-1d92-4540-8ebb-982af909d515",
    "department_id": "e9b3d126-b2b0-47ac-908d-3b6896122cf2",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "582916c0-5434-4e4d-9979-520c424cbcb6",
    "department_id": "609074a2-3402-42b1-aee1-2a6dc90b2eed",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "720f994d-7d4f-4b31-8119-886cb06ecf4a",
    "department_id": "052ddb0d-d547-4e5a-8192-74bd79ab6300",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "d87f82a5-32bc-493b-83fc-97bf9ec342c5",
    "department_id": "06298975-62e0-45ea-8388-30b05e5c35eb",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "e657c863-78ad-4a52-a9c2-5c00ab59b619",
    "department_id": "60dcb668-2945-4c36-9572-ffea17f04c65",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "9083ec98-c8f7-4025-adf3-22182af295e2",
    "department_id": "e5f140a7-ea78-4387-aa16-7342220622c5",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "069d78fa-7144-48cb-97f3-afbfaaf5bd82",
    "department_id": "e22db4fe-e166-439e-a97f-751547921a04",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "5464af16-2e6a-494d-9cd8-2f3192ab90ed",
    "department_id": "f736b665-41d4-4898-b887-5b00708ca3f5",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "cac84456-0bab-4a27-bbe1-4be5824b29a9",
    "department_id": "5315f616-77e2-4abd-9e8c-b4b371765646",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "707be663-e1eb-4663-8c92-2791b1c1e03a",
    "department_id": "3ec7f283-6ed1-4e17-8729-7dcefb85aac6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "f9d80582-2897-44c4-b332-b67852687972",
    "department_id": "ae4c6a8c-d5a6-4c9d-8484-5dc41c80bf4a",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "407cb07c-619c-433d-948a-9cecab0c749b",
    "department_id": "eb6d4422-3aa3-4268-9071-991a22b1792f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "02b41da8-88dd-4b09-a0b7-a47b1edeafc0",
    "department_id": "55e70d0b-5403-4fc5-ac13-eb98f1f87801",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "6a39dec7-033a-4b0d-aab9-55540b098469",
    "department_id": "858d7677-6673-472a-be88-4cd8169543e3",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "02e8e961-1de2-4ac3-84c3-49cd92d458a5",
    "department_id": "481b3c3b-02e4-4011-8e8b-e782dddbc19b",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "daa85ec2-f879-40e6-be2e-f95a578d43be",
    "department_id": "c49677e2-c1c4-4926-8323-120a3693fe77",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "85bd4f57-b08c-42e4-9ea1-1bb4d4002e97",
    "department_id": "f56f5a42-b5f8-4c72-8363-032faa39600c",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "6463498b-54b7-4b6a-9469-9b248636403b",
    "department_id": "e0e63fc4-256d-4941-9df8-d5d1e47b2714",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "0e6d4605-09b3-4272-8ce1-590d869dc46d",
    "department_id": "9fad4dd5-55b5-440b-b59f-899a1eaa6b15",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "431eb00c-85ad-4922-8fe5-862ab03566b9",
    "department_id": "9b800552-fcc7-4aca-bab9-9e9bdc1618c1",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "3fb4764b-8e59-4f9a-b8d2-80a771dc456e",
    "department_id": "9f55c64e-6eee-428d-8886-54b0ab0e1e8e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "90812bae-a509-454f-b30d-91ed158d8f7e",
    "department_id": "0431ce35-419e-4fc5-8ad2-643fe9b1ff30",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "65270272-3ca8-4cdd-b029-19f4b312e32e",
    "department_id": "3b677a48-fb0c-4cc5-a5e9-a90908454fa6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "c773c918-6895-4aec-a704-0604690b8b80",
    "department_id": "1f9afc7a-12bf-4745-9f58-292a8d4a8a61",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "77217bce-670e-4a3b-80fc-2dba5202ac23",
    "department_id": "0fac5da9-ef57-44e8-909e-c36f485e39db",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "62352a44-f034-4d21-ac78-7c300eb314dd",
    "department_id": "b3f4246f-a84c-491d-90a9-54fb3d55b07e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-06T07:32:39.261073+00:00"
  },
  {
    "id": "d2811b40-8e9a-4f0a-8662-bc86f5e1a073",
    "department_id": "51579f52-e630-4f8e-8693-9bbd18e4872a",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-04T11:50:54.981234+00:00"
  },
  {
    "id": "8a9e8fac-e7ea-48a9-8f9c-c8866b5344d3",
    "department_id": "c5bc5c63-e83c-4662-95d3-aa554e767a31",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "d561152b-1da0-40ab-a452-8c598744bc2b",
    "department_id": "2a3fab1c-034e-45f4-bef0-60fb1c23977f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "71e04c17-18d5-4b22-8f14-4d26509b4ffe",
    "department_id": "d1cc0cb1-d066-4262-945f-3c6b669ca9f3",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "89ea6228-5081-4b65-b061-aaddd6dc9f85",
    "department_id": "6df877cc-2e7a-4da1-93b2-520ed0e25816",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "8441e15f-27e1-42cc-995c-186f185ffbae",
    "department_id": "77585fd0-508a-404b-bcb2-58c151c99fcc",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "99fd132e-6eb5-4a39-b7e5-7f621caf448c",
    "department_id": "2c859d33-056c-4586-b662-ad4159ac78f6",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "e12b500b-9049-48b6-aa7d-490a5d694345",
    "department_id": "667418d2-790e-47e1-b780-cea0535cee69",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "004e3d55-ccfe-4f74-b5a8-e91c8de94743",
    "department_id": "3d0fdc3e-8dd6-4536-8df3-786a622ab87e",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "11574b96-ce3c-449d-aff5-57540c133dca",
    "department_id": "a0c8b6ae-918f-407f-b009-0be812dd54eb",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-06T07:32:42.212335+00:00"
  },
  {
    "id": "e5ab50b2-fc9a-4712-97fe-20b9ce335236",
    "department_id": "2dde32a0-2677-405e-a63b-4c6894b1248a",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "83415157-eaef-4072-b596-15c5bddc699b",
    "department_id": "9bd047ef-b722-407a-9916-473c8e24d100",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "1b01f67f-1688-40ec-8cea-0398f0670f3e",
    "department_id": "50cdec84-89f3-41f5-b3c5-71a3c47e4fd2",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "c5dfa585-a727-4c7a-b966-d0d3eb84385b",
    "department_id": "e51ce36a-1d05-4376-91f6-ad90e437b8a7",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "cbe43b04-4976-4485-8cfb-98cff378ead1",
    "department_id": "652a6d57-53cc-4adf-ad5a-5dd1d7a2d271",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "41149df7-73a4-44b4-b407-698cc073de47",
    "department_id": "4f62d074-d58b-4125-9c47-b5fbf8e6b335",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "ee22f371-2d89-4d9b-bae0-2873284dd966",
    "department_id": "860acb81-c65f-4f98-aa21-49a22409d78f",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "55d5cb30-2681-4592-afd3-0fbb0b95a66c",
    "department_id": "6d1a561c-bd46-451b-a385-1463ce16bbb9",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "732025bb-93ae-4746-8340-516391a1ed32",
    "department_id": "2c161351-11a7-4457-a9e5-37f517d3d444",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "bab9af28-aa74-44e3-88cd-769f9bd25296",
    "department_id": "dcf41bf0-37f7-4014-bc59-de9980c647e8",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "bac6b7cc-84a8-4a43-83e4-267fb2be2e0c",
    "department_id": "1286f06b-ff2c-4a08-b224-01668f6a260d",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "b596236d-8725-408a-a466-36a365aebe5a",
    "department_id": "d2003bf6-1fd2-4b65-8d93-9bcac87badca",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-06T07:32:41.672337+00:00"
  },
  {
    "id": "96bb55f0-b138-4231-999e-8f6ec3c68ae6",
    "department_id": "d3fe33ea-d836-4172-9030-0dcb5be6f573",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "dc39f7cf-6007-4c36-a79c-ecf650902688",
    "department_id": "a80c86ea-ba91-4218-9178-2d50e472c303",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "aec4309f-5f56-49f1-b8c0-a63d48ccdf53",
    "department_id": "7fc3f679-29b2-47bb-924a-1f089f28dbf4",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "7d6f0ad8-0dca-4dc1-a0ad-5de68575b16f",
    "department_id": "3fdeaa03-919b-410b-81d1-3d58b202423d",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "5e7faf3b-82fb-4168-a838-07750788fb38",
    "department_id": "6133c916-d438-4ab5-ad8c-976df1cccebe",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "236297c3-cfd5-437f-92e7-c5be3009008a",
    "department_id": "66b6c510-72cc-426d-8d8b-8e738d47b12d",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "e3868a8e-2b46-4bf0-9f9e-e4cd607aec23",
    "department_id": "94dcf306-b0d3-4410-9b09-db7ff6c49f15",
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "a1b55813-119c-4ed0-8ec5-2a91af25454c",
    "department_id": "b13fb09c-118c-4fdc-a86e-fa9b3399c880",
    "name": "Doctor of Ministry (Online)",
    "code": "DMIN-OL",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-06T07:32:39.312398+00:00"
  },
  {
    "id": "c8ed0e88-a096-4335-bb84-8bb2b838db46",
    "department_id": "08b1dfaf-469d-47d1-b093-2b9614af6cf5",
    "name": "Doctor of Philosophy",
    "code": "PHD",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-06T07:32:45.336021+00:00"
  },
  {
    "id": "f010f082-9425-47f2-bb88-41d862beb4bf",
    "department_id": "5c043e79-6acd-49de-af6e-00fbf67d6e34",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "577ebf2a-c9c0-4ff4-b6c3-3dc304c8d821",
    "department_id": "3ec7f283-6ed1-4e17-8729-7dcefb85aac6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "990db036-69e7-4870-92d3-cccee0bf01a4",
    "department_id": "7289d7b1-df7a-4fe7-a2ae-cd55c9bd29ce",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "1c07bad5-737c-4dc1-a86a-5b5669153ff1",
    "department_id": "c6baca87-beb6-4283-8f67-aa0236644b91",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "ae4d38b3-e337-4a63-931e-f463d02039cb",
    "department_id": "0e0fe759-922c-4abf-9945-2e6472dce8e6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "ba3de2db-1ccc-4338-a2dc-15fad3617647",
    "department_id": "7fc3f679-29b2-47bb-924a-1f089f28dbf4",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "d2e46691-a16c-40ae-9b1a-7e72c8fbd768",
    "department_id": "a293b125-3bed-4798-a726-ce6fd633123f",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "e772b25b-89f2-46fd-a4c5-1a1495d7ea0d",
    "department_id": "341223ca-c75d-41de-9325-815dc23e79a6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "70db2775-45ca-40af-a335-040f53652f90",
    "department_id": "b45d0a72-5f8c-405c-a715-8293b3b4dbf6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "fe43ac81-e79e-4568-a60d-1ff25dd94ab6",
    "department_id": "642b6c16-d6a5-46b5-941c-f90081df78a9",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "ddf50450-40c2-4975-a5ec-38461bc5ecc1",
    "department_id": "2bb5fd82-e5ad-46ae-b769-3d1a8f3535db",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "f731a145-fa91-4c71-a036-ba4ac79f72de",
    "department_id": "ee1b294c-0bae-40b0-a5a3-46b1230517bf",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "6df4e446-5872-4573-843e-09be5423d6dd",
    "department_id": "975cdfc5-3978-474c-94f1-0b29992fc0c6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "137eba1c-1f2e-40cd-93bb-8f620cdb4182",
    "department_id": "481b3c3b-02e4-4011-8e8b-e782dddbc19b",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "e1193711-fa2a-4a1e-b563-4650bfade0bf",
    "department_id": "d3fe33ea-d836-4172-9030-0dcb5be6f573",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "559d1d43-4638-4708-b8b6-45be8454fa32",
    "department_id": "58578c78-38f7-441f-b71f-87e1dee7c04a",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "62a261f1-d3f6-4058-814a-cdb2cf1b0e30",
    "department_id": "06298975-62e0-45ea-8388-30b05e5c35eb",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "2f8762a5-f173-4299-8a90-d04b7a15c473",
    "department_id": "d8d64710-423d-4158-a054-857f4694e70d",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "7c70043e-7063-4262-839c-491be95b805e",
    "department_id": "c3d8d41f-cb6b-42d2-9026-339da5b7ffe8",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "c6d1e1ef-9d23-41b5-ad21-3d280de47e74",
    "department_id": "8c334237-e6c0-40ef-96fa-99e9064cb28d",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "60666fac-8a36-4e8d-a958-5c4387026e8e",
    "department_id": "914f3ba0-b33b-40a5-b7b2-76b2a636ba38",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "96909aee-3c3f-4fa3-9911-4f8449348f9e",
    "department_id": "264843fa-a9cf-4864-a434-32935e4ab6f5",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "4b6cf998-1b70-4e18-a15b-490345d149d5",
    "department_id": "9ae71be5-a9b8-47b8-affb-fd6f486957df",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "595cc524-0e83-463d-8464-051e255885fb",
    "department_id": "4aa3858d-a701-4745-893c-7e1a6fdb1e76",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "e4fd1529-858a-4fde-8ded-87a858e83173",
    "department_id": "ed54e04e-b356-4bc4-98eb-01e5f9167d68",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "15fd0633-f23f-4c0b-8b89-0c37e4d87a88",
    "department_id": "5ec29532-0774-4499-ac65-3cd140968b46",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "aeba7232-ba54-4f9b-a533-166469bb60ec",
    "department_id": "714de06c-b22d-4c69-b1b6-a8ba89618046",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "ebe2016e-03b6-4501-9077-0fd9c63f13d5",
    "department_id": "401df322-3ff0-417c-8132-292b6d969e72",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "deedd61c-7b52-41bb-aa15-2e8c59eaca15",
    "department_id": "0c743554-2d28-4738-a7db-388b3a4a05a1",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.144502+00:00"
  },
  {
    "id": "5946e292-1b73-4416-9b5b-915973057dad",
    "department_id": "4124db1b-9d20-4bb7-99b2-935078f8c7b8",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:02.992027+00:00"
  },
  {
    "id": "4c7a8038-c705-460c-a223-bed9f43224a5",
    "department_id": "e151fa82-1c7a-4253-9ecb-6eb0be01e843",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "2b7e289f-3a6c-4637-8427-82b192a4fd21",
    "department_id": "298a101d-74c7-4b09-b416-b219f51d0b15",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "ac95c764-99a6-4057-9f82-be7f19c33dbd",
    "department_id": "3fdeaa03-919b-410b-81d1-3d58b202423d",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "bbecfa19-f78d-4a61-b130-1bf8def685cf",
    "department_id": "9f55c64e-6eee-428d-8886-54b0ab0e1e8e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "0794db03-8f5f-4131-9417-6eca603a7fa4",
    "department_id": "e01d5da2-91d2-4758-b95e-acd2b55eb8ba",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "2324446b-beb5-4a58-a1ec-07d8bcc3a5b4",
    "department_id": "bf951b67-b4b7-4f9c-8f93-87de50eed8aa",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "893f3763-0699-4b5c-b4a2-08544cb37f73",
    "department_id": "1286f06b-ff2c-4a08-b224-01668f6a260d",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "88eb0d54-7625-4f07-9004-1042593df150",
    "department_id": "f736b665-41d4-4898-b887-5b00708ca3f5",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.09461+00:00"
  },
  {
    "id": "269a7741-f5f4-46e1-a16e-1ef0d7afec29",
    "department_id": "8dae2c63-e0e7-461f-8e20-c278c79d4bd0",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.144502+00:00"
  },
  {
    "id": "48582733-7193-4872-befb-6d55506dba2d",
    "department_id": "eb6d4422-3aa3-4268-9071-991a22b1792f",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "dd2754dd-4ba1-4d95-b58b-cb75c021ef5f",
    "department_id": "e0e63fc4-256d-4941-9df8-d5d1e47b2714",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "1862d11f-81b1-4ac9-8740-1b28fe5de191",
    "department_id": "e51ce36a-1d05-4376-91f6-ad90e437b8a7",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "eb0a438d-f340-470f-bf92-7ba79b1c4930",
    "department_id": "3d0fdc3e-8dd6-4536-8df3-786a622ab87e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "0605ad09-e9e7-4da3-85d2-7c7099481086",
    "department_id": "2bbf45f1-6345-44c9-8bed-e87096f3bd80",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.952258+00:00"
  },
  {
    "id": "89420d82-76ae-46de-b44c-fb74a39ebc2d",
    "department_id": "b2f8e57d-04b5-418e-88f5-c7cdb6f26c4c",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "349453e6-c0c9-4afc-bc56-a3cbfc0e2225",
    "department_id": "7cc69375-a30b-4c37-9d72-55b986b6f69e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.143864+00:00"
  },
  {
    "id": "ad23cc4d-c9e5-4161-8d00-2031f8a14bb8",
    "department_id": "0bdc2bf1-1eda-416d-bc8b-919b084457e7",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "1e27f40e-f4de-41b8-8dfe-3b2ccc29b1ce",
    "department_id": "eabf2251-c8b2-4b40-9516-04d447cfbc77",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "e9f1ca97-0330-4024-b210-50a82b311be9",
    "department_id": "609074a2-3402-42b1-aee1-2a6dc90b2eed",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "c97e437f-4270-448d-9518-a6a987a1f258",
    "department_id": "860acb81-c65f-4f98-aa21-49a22409d78f",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "e82b70f8-07ce-415c-b84d-1e40ee157e4d",
    "department_id": "4b08487b-059e-4496-8bcf-e98d728d14ca",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "87d9d356-3a5a-4c31-8207-e700c5fb5035",
    "department_id": "16fd3961-f242-4f2f-80a4-86f858421fe9",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "cb0176a0-6900-4e97-b2db-7accdca259a9",
    "department_id": "b3b039d0-2908-4a1f-b87d-be4625f4388e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "a4fed6fd-d279-4c14-9748-3b22e24fb00d",
    "department_id": "9bd047ef-b722-407a-9916-473c8e24d100",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.254395+00:00"
  },
  {
    "id": "a5f4c96d-d2f4-43de-b0d9-e549428a1370",
    "department_id": "d3e09725-e53d-4947-8502-ba74dd836876",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "bcf4af6a-a88e-4d25-b81a-1844d53911b9",
    "department_id": "e12e7010-e492-4f7a-aad2-8418dd59661f",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "b1226d32-a9da-422d-8061-b2cf4baf8d29",
    "department_id": "c42eb7bc-31c8-4aaf-af30-be36df0e31c4",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "9687b2e5-7b69-4c71-b182-14c6aa32db8c",
    "department_id": "667418d2-790e-47e1-b780-cea0535cee69",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "104e0081-0e5b-43a7-850b-384ad4ee4b27",
    "department_id": "9124b249-b5d7-454f-933b-a621b40f2e4e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "79b8f0e9-7727-42fa-a0ec-a80627c69e60",
    "department_id": "de4aa189-fba2-4842-b83f-3258d54a1340",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "06b66283-2d2f-4ceb-9c28-06d3bd785451",
    "department_id": "3d87f153-54bb-4738-9910-be8668a99baa",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "f516da66-6813-4c27-a4da-5b917c525333",
    "department_id": "5c5c8c50-d06f-4d8f-aa64-512a76a1aa0f",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "c569e1d6-edd7-4b2f-8716-37e8ccdc0bf5",
    "department_id": "0f98439d-4220-46bf-846b-3689b020854e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.35863+00:00"
  },
  {
    "id": "356eb69c-17e7-4208-9fb1-43d9f1cd7011",
    "department_id": "41805d2c-684c-4ae5-a5e2-32b1c1fdf898",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "30138c01-46e3-4eac-aba1-ca6fdb570a25",
    "department_id": "cc2c5d68-d115-440d-8d88-2fdf5c82f394",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.902298+00:00"
  },
  {
    "id": "3bc54e53-d237-48d5-8107-e99570160d3a",
    "department_id": "ad833830-8b32-46ea-a9d2-3e6e5219d747",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "7be27400-ed96-404a-b39e-b4554ec85b4a",
    "department_id": "249c35a4-17fb-4c23-a074-e4ca7a584cfc",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "8712f44e-0ff7-479a-bd5b-0179a5beeab5",
    "department_id": "d883711d-039f-49bf-981f-3c283600e697",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "a5810339-fbc3-42c3-915b-239545369a54",
    "department_id": "a9c3365e-72c2-4ea9-af74-bcc17d53372a",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "2d0872b3-209a-416b-bf51-bf8554f3e18c",
    "department_id": "4635244f-4bab-45d0-a0a3-0a55a639f196",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.416711+00:00"
  },
  {
    "id": "cba46f3f-b177-4b32-8531-e750f1fb3d2b",
    "department_id": "f900ec42-d48a-44ef-a94b-3c9cd4c28124",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "c3b0b60c-6228-4dc3-b4e6-342834da8475",
    "department_id": "7139477e-3ca2-4878-9d8c-7c3234f29034",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "3cb52ec1-fa98-4ad0-a877-fccb4569e54d",
    "department_id": "5de50c5e-3f4d-4e28-83cb-dd4aa5a4d19a",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "238d6e11-6665-4474-b43d-9cdbeb3a66fb",
    "department_id": "22af8c34-5e5d-439c-a6fc-a088f609b125",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "9f397c11-3c45-454a-be54-ce4c33b2e319",
    "department_id": "56ef12fa-a98c-425e-b803-f903a464af5e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "79ac97cd-19f9-44eb-acf3-5ef1753e5286",
    "department_id": "85eca5f4-0ac2-4e8e-839c-30b72cccbba6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "e5484a41-38bc-4173-920b-da5dd29fc01b",
    "department_id": "cce044d7-eab4-4652-931a-c0dfaf7bb4e1",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "a63619fb-f189-412f-8689-b6aeaf08f560",
    "department_id": "e9f756da-9cfc-4aa2-ba75-5ae3dbeb2351",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "f4223c7b-197e-4549-939e-55a700d7d6e8",
    "department_id": "674160ce-5053-4c18-96e7-eea7dc74921a",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "73b6fa31-11cf-44a4-8901-af995d1bf5f6",
    "department_id": "60dcb668-2945-4c36-9572-ffea17f04c65",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "e3f84169-49b4-49da-a249-e06a0434158a",
    "department_id": "858d7677-6673-472a-be88-4cd8169543e3",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "7dd74f52-28d4-4f17-a740-d4df3d9130d3",
    "department_id": "9b800552-fcc7-4aca-bab9-9e9bdc1618c1",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "0add7910-9a94-4271-a88e-9b930727fb49",
    "department_id": "3b677a48-fb0c-4cc5-a5e9-a90908454fa6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "1bbb077c-0eb7-468e-9615-3d079aaca4c0",
    "department_id": "77585fd0-508a-404b-bcb2-58c151c99fcc",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "913468cd-9d27-47df-b4eb-8e44baa38301",
    "department_id": "6d1a561c-bd46-451b-a385-1463ce16bbb9",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "147254ef-7ede-46bc-98f0-25e73f04484b",
    "department_id": "0d10b03d-c27f-4cfa-a8b9-d4452758be37",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-06T07:32:39.360085+00:00"
  },
  {
    "id": "708fd6eb-a00e-455d-9d81-c7a9b71488f9",
    "department_id": "a80c86ea-ba91-4218-9178-2d50e472c303",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "60cc49fd-aa62-4c9b-beef-b1279b456643",
    "department_id": "6133c916-d438-4ab5-ad8c-976df1cccebe",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "e66da13c-0e84-4587-8116-93b0a047b84a",
    "department_id": "4c59d98f-5f43-4eb9-b507-afaab1b8a12b",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "58927661-60db-47e8-8342-c8864315bec4",
    "department_id": "14cbe224-5a00-4ab8-9c40-6dd22f33a747",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "0de8464e-f296-4bd4-bd95-5238d74c608e",
    "department_id": "e77b8c4a-ec42-45dc-b513-ad33a5329d8f",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "7cf7816d-763d-4e06-9de7-bf4e911c2a5f",
    "department_id": "33c6aaed-63c0-465f-8608-3da4df8cfc91",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "41078824-bcbb-495f-b8b9-5e6b0614aaa1",
    "department_id": "8d458a1b-c28f-40a4-9be8-84f6c2e58b11",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "729f7293-cf37-4e15-8f89-97d666d334c8",
    "department_id": "da081e85-f648-45d1-8938-94d9b53d1190",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "2ee500c3-c374-44f5-9174-e6b468aeaefb",
    "department_id": "62a9155d-a40c-4253-9809-c243161a89b4",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "7fb55bc3-877a-49e9-83e3-cb9600ee73ee",
    "department_id": "c0f77174-9c35-42b1-8e63-a95a9afae25a",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "006b3aac-edd5-4c53-a89a-6c2c14ea6e2a",
    "department_id": "9141d4dc-63ab-4deb-b1a3-dedb3af0da5e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "ce5533c6-6a96-4033-a8af-eecfc54b12d5",
    "department_id": "3b3e5a1a-a94d-4382-b51e-18ae6096b9d3",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "3fe2e51a-7616-4aa9-b295-d6332c3ee049",
    "department_id": "f56f5a42-b5f8-4c72-8363-032faa39600c",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "23c4f3c8-2972-4a94-b15b-f6eba39654da",
    "department_id": "2a3fab1c-034e-45f4-bef0-60fb1c23977f",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "d47d7955-ee85-4cbe-a17c-81d967536dbf",
    "department_id": "adc7363e-7702-4616-a277-98f24576b441",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "7c326da0-6647-4fda-af7e-70600c1cf88f",
    "department_id": "1f9afc7a-12bf-4745-9f58-292a8d4a8a61",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "d783be60-cb7e-4ea3-aabd-38e81edcd8ab",
    "department_id": "fb949836-12d6-4a29-886c-5ddcd928fc68",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "fd8e02ef-d14e-466c-9cfa-51a70f672f71",
    "department_id": "fac957ec-8628-48af-9c4a-012bf970a1e2",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "c98dcd37-e3a3-4e81-87cd-2110096de4a6",
    "department_id": "39ede850-015b-4ee6-a6a4-d7f837a5c50b",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "caafaf8c-69ae-48e0-9cd0-452ad56cb7ad",
    "department_id": "5bdc8884-2445-4663-af8a-e42219f18ac7",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "cc2a7f75-8ec2-451d-9c89-84c21e0472f0",
    "department_id": "0a3897ce-2402-4167-9ee5-ffafbe875be2",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "964e7c2e-9919-4fc1-a617-05717848941a",
    "department_id": "06dde63d-8e41-4101-9d6b-170d49731afb",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "049ae7b3-9fb2-4a1f-932c-999b520bf44f",
    "department_id": "564d9526-8f95-4238-8c9e-1f6ec7fe6a00",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "693056b3-1f82-4cd9-a2d3-9dcdf619891b",
    "department_id": "0431ce35-419e-4fc5-8ad2-643fe9b1ff30",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "c5c7eb35-a621-43c1-bffd-46213cc399f5",
    "department_id": "00f23b94-b51d-438d-b6fd-257e4ded39eb",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "9056048f-241f-410a-a0e0-c83b87fbff72",
    "department_id": "991a92fd-33f7-44be-a01e-aa9a5e8e3ac3",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "89f826ee-05a3-4354-99ac-006863326bc9",
    "department_id": "5036fee2-7f17-4e86-8297-ee4401cd976e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "548d26f5-2744-42f6-a417-0501474e7916",
    "department_id": "0247b6c7-bfb5-4708-8991-589427a9d5b9",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "97281b25-97cb-4f5a-b102-af36f8666980",
    "department_id": "e72d7705-a1a0-4ddf-af95-54aeb0e59685",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "e98db1ea-2646-40b2-bafb-c3ba10433cb6",
    "department_id": "e22db4fe-e166-439e-a97f-751547921a04",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "93d5d581-4770-4903-bd99-f13633772d90",
    "department_id": "b536f10e-ed19-47f4-a6a7-b19d39736715",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "6b98f7a9-6071-4cf0-adc2-ff3aa4ef9968",
    "department_id": "c25fd5fb-3690-4ad9-bdc1-c010b6b564da",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "885af217-35d1-4872-b5d5-365476792d55",
    "department_id": "9fad4dd5-55b5-440b-b59f-899a1eaa6b15",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "6bc12fec-66b0-4c04-8fca-365bc11355ba",
    "department_id": "95899934-1e17-4e12-b4d7-def27341fcf2",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "a4c4c42f-d8f3-4981-b733-a2966c9df02d",
    "department_id": "1cc2b5e9-e15f-4767-975f-20a8881c9908",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "a17a2790-026c-4c77-8081-50bdf14e8805",
    "department_id": "e6348261-d09b-45a1-8e3e-cfb4361e219b",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "932422bc-e06c-4c1a-8967-1c27391a4b56",
    "department_id": "6df877cc-2e7a-4da1-93b2-520ed0e25816",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "557a3726-899f-45c1-9eca-c13a35454012",
    "department_id": "8e059ed7-1714-4d8c-8d68-d023520d988b",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "7a3726ca-f0c5-44f8-aac4-2fb94f322b49",
    "department_id": "4f62d074-d58b-4125-9c47-b5fbf8e6b335",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "cb5b0a89-9757-4118-90f2-ecba29f0a49b",
    "department_id": "c1200c7b-ad94-4706-ba06-e2310e2cda4a",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:03.967975+00:00"
  },
  {
    "id": "b1683218-a114-483c-88c2-bc2cf1dbdccc",
    "department_id": "d1cc0cb1-d066-4262-945f-3c6b669ca9f3",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "448ad6c2-3502-4266-ad66-9b103f4241f2",
    "department_id": "248b1121-3088-4fb0-8229-c153973ec662",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "f4bf9be0-28b4-4b7e-b69e-ec7eda4818eb",
    "department_id": "c7eddd25-fd68-40ad-bb9a-b0f46fe891f0",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "4de07c44-432a-4061-83f3-580414579eec",
    "department_id": "e6dd8d2a-36a0-49e7-bd0d-c233f65f9582",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "f33acb84-f9f3-4676-b118-2cd2c6ba635e",
    "department_id": "7fb084bb-b3a0-41fb-8d86-8f5c03ba8ff3",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "07f48e33-b23a-463c-b80e-9f2ce844b36e",
    "department_id": "0c936f95-2ffe-473b-95d6-c6040308ee22",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "347187b6-5134-4010-b593-0017567e8ef8",
    "department_id": "e71f8478-1368-48ee-a4e1-95ee0740acbe",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "514e2b3a-7f46-4208-a0a2-66da98de58cb",
    "department_id": "2dde32a0-2677-405e-a63b-4c6894b1248a",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "3dc0d9e8-f940-4a33-ae5e-0081bd53d50e",
    "department_id": "dcf41bf0-37f7-4014-bc59-de9980c647e8",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.013741+00:00"
  },
  {
    "id": "a5e772f9-c800-494f-88d0-509d92556aab",
    "department_id": "2c859d33-056c-4586-b662-ad4159ac78f6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "29a76d48-d114-4d85-80dc-3ef213efb997",
    "department_id": "ae4c6a8c-d5a6-4c9d-8484-5dc41c80bf4a",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "1b4b0949-e266-4434-9e75-c262765f05ff",
    "department_id": "5315f616-77e2-4abd-9e8c-b4b371765646",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.746878+00:00"
  },
  {
    "id": "bef3b48f-8933-4f03-8663-6e877a2165a0",
    "department_id": "7850604d-4d90-484a-8f8c-1a81058100c0",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "89147c91-fb35-40c2-a202-96927fc98aa1",
    "department_id": "ad932cf0-e664-4495-a6f8-5e000aaf339b",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "8f3eb2af-8241-40d0-9078-65ccb9611c18",
    "department_id": "b5e5b62b-53fe-490a-8427-5bcbaef7f07e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.065184+00:00"
  },
  {
    "id": "09f16a8e-80ed-4703-97f8-427891e57aea",
    "department_id": "514c7b18-bf75-432e-b83a-d250347f91bd",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "99477ff9-79b9-4df6-ace1-3955689273d8",
    "department_id": "97d961bb-3a22-4d55-a813-f08d09e283b6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "3a51627a-8fc0-4d0f-a4c4-d21150db12c9",
    "department_id": "85527bb4-320c-4f21-8144-c38c3a89757d",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "2a4358ac-23a1-4db0-9faa-a988c7f56ef7",
    "department_id": "e5f140a7-ea78-4387-aa16-7342220622c5",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "8b9d71e4-56e4-44d6-b0a1-7662278ad2be",
    "department_id": "e9b3d126-b2b0-47ac-908d-3b6896122cf2",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "bcd34e00-6689-42a9-adda-38d8773784ed",
    "department_id": "66510648-c56a-4c36-9af6-0e0865ad325f",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "9e5f9974-6b0b-484d-8dc8-7d0a839d2255",
    "department_id": "58fa2e1e-9ed6-4465-954d-aee142622ec1",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "50e5acc6-28aa-43f5-b542-087792fe8221",
    "department_id": "78b18e20-da8e-4ff0-86a2-5e9d46e113e2",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "34b2caf0-9ee6-4a94-87b0-47ccd491750d",
    "department_id": "66b6c510-72cc-426d-8d8b-8e738d47b12d",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "81c5d998-1dda-4463-a7f7-09728f76d194",
    "department_id": "4687cef7-544f-488c-8976-300fb0a5f67e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "8c79cca9-bc21-4771-9d75-ac95a1e3621a",
    "department_id": "dca47b11-8a02-4cc0-981f-671896fc3692",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "5d5018d1-9d5e-45b1-a7bb-f4bf4afe1b27",
    "department_id": "60c3b366-a794-4ba5-ac02-f3e15be2ea4f",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "88df24b5-4fec-4d16-9b85-6db791d24dc0",
    "department_id": "94dcf306-b0d3-4410-9b09-db7ff6c49f15",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "a0cd7cee-65f5-46e0-9f74-08596415e3e5",
    "department_id": "652a6d57-53cc-4adf-ad5a-5dd1d7a2d271",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "6a2e1988-c5ec-4239-b3f2-fc996bdc35ca",
    "department_id": "c49677e2-c1c4-4926-8323-120a3693fe77",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "95090d84-3e3c-401e-9c94-4682656ac27a",
    "department_id": "ceeaed66-bf35-499e-9497-8cdc689444e6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "d41a096c-305f-4413-9c9d-f69546e94836",
    "department_id": "73c3d6b4-a2f5-45f3-9d6d-01b20cd1fc7e",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "e1d3a13f-9278-4775-9c21-337e697cfe0e",
    "department_id": "501e993b-a036-4650-adb1-a58b986a1fd7",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "d1dfdd04-7306-41a8-b6b7-65523df0707e",
    "department_id": "5580330b-5fa3-47d8-84c1-8cf589e410bf",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "eca39b13-7a05-405d-87d2-9507d4b9b4f3",
    "department_id": "3cc21a46-06d0-46e3-99b2-0988a15cb1f4",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "714c8d71-6462-4657-ad36-0ad830e1b2a1",
    "department_id": "50cdec84-89f3-41f5-b3c5-71a3c47e4fd2",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "b1aeb89b-16d9-41de-aebb-2e22a20d460c",
    "department_id": "4452e861-be19-4d8d-9952-7859ef3c38c5",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "cef18f05-62b6-4357-972c-8cf77a0e927a",
    "department_id": "55e70d0b-5403-4fc5-ac13-eb98f1f87801",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "e2188298-d1d6-47f7-a930-0fd01def4ddc",
    "department_id": "96b1fd6d-8a74-47b2-82b8-0ac1ad011acd",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "31ccea0f-04f9-43e2-9508-7faa1040235a",
    "department_id": "c5bc5c63-e83c-4662-95d3-aa554e767a31",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "cb8963c8-63f8-4f86-99cd-8d0fa2798425",
    "department_id": "052ddb0d-d547-4e5a-8192-74bd79ab6300",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.222815+00:00"
  },
  {
    "id": "6f75ef8d-15bb-432b-b96e-fe99fd24a059",
    "department_id": "2c161351-11a7-4457-a9e5-37f517d3d444",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "f1ed20ff-9a4e-4fdf-8bd8-6c307de8d198",
    "department_id": "459f14de-a6e7-41d2-8f6a-a1e305e37693",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "0ef6e2bc-2dd1-4823-9264-b9fe3d3d8088",
    "department_id": "8da7d80a-eca1-46fe-89d8-83c8ab92d5b3",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "e9f79151-7828-4c29-88de-77286d4bec08",
    "department_id": "1b53c176-8300-4c5b-a8ad-0d03550c2e09",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "50bb760a-c5fa-4d49-966a-156107633e55",
    "department_id": "0fac5da9-ef57-44e8-909e-c36f485e39db",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "b3416153-698b-418a-928f-b2f19eca210f",
    "department_id": "f3821d2b-c012-409b-b288-b7b815bd0ce6",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "0333524e-b08f-438f-a651-feefaecb74bb",
    "department_id": "429444ad-4615-4637-ac60-e1725f225b7f",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "222501f4-a514-4a06-ab37-0999512a0f62",
    "department_id": "436005ef-4ae4-430f-948e-38c7ab5e5b8b",
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "a920c818-46aa-4198-8842-1e233ecdc113",
    "department_id": "bef81bdd-c95e-4098-a8c9-cfcf0df05cc6",
    "name": "Doctor of Philosophy in Biblical Studies",
    "code": "PHD",
    "degree_level": "DOCTORATE",
    "created_at": "2026-09-04T11:50:53.448366+00:00"
  },
  {
    "id": "a0e87b4c-dfb1-4efe-847c-8c0b5d1ca8b6",
    "department_id": "3b2de3b7-070f-45aa-bf5c-5ca5834be202",
    "name": "Integrated M.Th",
    "code": "IMTH",
    "degree_level": "POSTGRADUATE",
    "created_at": "2026-09-06T07:32:39.407115+00:00"
  },
  {
    "id": "2ca29e35-0790-48a0-9ba9-448a0cdff19b",
    "department_id": "b13fb09c-118c-4fdc-a86e-fa9b3399c880",
    "name": "MA (Online)",
    "code": "MA-OL",
    "degree_level": "POSTGRADUATE",
    "created_at": "2026-09-06T07:32:39.455967+00:00"
  },
  {
    "id": "8e6c01b3-0d8f-46e9-b90e-6170796f6efd",
    "department_id": "a4cbb654-5c79-436f-9329-fde925b4c15f",
    "name": "MA (Online)",
    "code": "MA-OL",
    "degree_level": "POSTGRADUATE",
    "created_at": "2026-09-06T07:32:42.740821+00:00"
  },
  {
    "id": "211bf2f0-e3c2-44fb-aa7c-076ee5c8f8f5",
    "department_id": "be7cde1e-12ee-4b03-b0db-bdbf48d5a1d1",
    "name": "MA in Christian Studies (Online)",
    "code": "MACS-OL",
    "degree_level": "POSTGRADUATE",
    "created_at": "2026-09-06T07:32:42.274165+00:00"
  },
  {
    "id": "d4fb82bc-5205-4e79-b517-a4e18c6b9245",
    "department_id": "26b324a4-9495-4f51-8761-b29c69583209",
    "name": "MA in Intercultural Studies",
    "code": "MA-ICS",
    "degree_level": "POSTGRADUATE",
    "created_at": "2026-09-04T11:51:00.661997+00:00"
  },
  {
    "id": "36684f51-6efb-4b86-9ce1-2d8174951e10",
    "department_id": "3b2de3b7-070f-45aa-bf5c-5ca5834be202",
    "name": "MA in Theological Studies (Advanced)",
    "code": "MATS-A",
    "degree_level": "POSTGRADUATE",
    "created_at": "2026-09-06T07:32:39.500297+00:00"
  },
  {
    "id": "1e5b3039-9b64-4ccf-9535-03ccc3c5f084",
    "department_id": "b13fb09c-118c-4fdc-a86e-fa9b3399c880",
    "name": "MA in Theological Studies (Advanced) [Online]",
    "code": "MATS-A-OL",
    "degree_level": "POSTGRADUATE",
    "created_at": "2026-09-06T07:32:39.547824+00:00"
  },
  {
    "id": "78dfe323-8734-43ee-9842-a0e96debc2d3",
    "department_id": "36703305-899b-457a-865b-e20dc203700c",
    "name": "MA in Theological Studies (Online)",
    "code": "MATS-OL",
    "degree_level": "POSTGRADUATE",
    "created_at": "2026-09-06T07:32:42.561333+00:00"
  },
  {
    "id": "9e0a41c2-9581-4cdf-9dc8-483b79311a48",
    "department_id": "00f23b94-b51d-438d-b6fd-257e4ded39eb",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.911904+00:00"
  },
  {
    "id": "7a837ebb-bf4b-45ec-8c30-917a8ffe1f0c",
    "department_id": "d8d64710-423d-4158-a054-857f4694e70d",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "a5168955-862a-4002-adc9-05ce9ce55ddc",
    "department_id": "58fa2e1e-9ed6-4465-954d-aee142622ec1",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "a89f39af-1ee7-46ff-9ff3-9e7d82a68b7a",
    "department_id": "991a92fd-33f7-44be-a01e-aa9a5e8e3ac3",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "ac7eb07b-c617-489a-8e6a-7b352bcabf26",
    "department_id": "0431ce35-419e-4fc5-8ad2-643fe9b1ff30",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "9eb0947e-f81d-4e06-95b5-a3d1b94a2e58",
    "department_id": "564d9526-8f95-4238-8c9e-1f6ec7fe6a00",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "83081f53-96de-47c9-9e40-84a3f1a1fc87",
    "department_id": "0a3897ce-2402-4167-9ee5-ffafbe875be2",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "34a62e56-200f-4e91-9f2a-4fee02e04a29",
    "department_id": "06dde63d-8e41-4101-9d6b-170d49731afb",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "48181321-7d66-4c61-b1d4-55cd4faa81d5",
    "department_id": "5bdc8884-2445-4663-af8a-e42219f18ac7",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "b918eac3-0fbb-4413-8b7c-9e3b73b7815b",
    "department_id": "39ede850-015b-4ee6-a6a4-d7f837a5c50b",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "0cd49837-793a-4e9c-b4b3-c9b43ac33a7e",
    "department_id": "3ec7f283-6ed1-4e17-8729-7dcefb85aac6",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.632037+00:00"
  },
  {
    "id": "8cc1956f-fac5-4d7f-9816-66dca905b699",
    "department_id": "78b18e20-da8e-4ff0-86a2-5e9d46e113e2",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "562c5c2d-e10b-4820-ac98-c07e4f302779",
    "department_id": "1f9afc7a-12bf-4745-9f58-292a8d4a8a61",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.823676+00:00"
  },
  {
    "id": "a59b9467-9624-4eae-8d1e-0a8fb5fea35f",
    "department_id": "fac957ec-8628-48af-9c4a-012bf970a1e2",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "0cf3e63b-e4fb-46ef-a3f6-454e5a967493",
    "department_id": "c1010ebb-8461-4a0a-8a92-806944d99103",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "POSTGRADUATE",
    "created_at": "2026-09-06T07:32:40.293708+00:00"
  },
  {
    "id": "6afc1b4a-f6f2-426b-bed5-6e6c3b11c176",
    "department_id": "4687cef7-544f-488c-8976-300fb0a5f67e",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "4c9b81ec-a274-472f-8e2c-6055458a18d6",
    "department_id": "adc7363e-7702-4616-a277-98f24576b441",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "95eb2868-ec89-448c-a6b1-bce5e3d228a3",
    "department_id": "fb949836-12d6-4a29-886c-5ddcd928fc68",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:05.075384+00:00"
  },
  {
    "id": "3affef15-21be-4d8a-b6f6-1199915da483",
    "department_id": "2a3fab1c-034e-45f4-bef0-60fb1c23977f",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "352c3002-06f0-4007-8736-5ec00296c18a",
    "department_id": "0fac5da9-ef57-44e8-909e-c36f485e39db",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.422407+00:00"
  },
  {
    "id": "aec7cd73-9b86-428e-8eee-99ddba376d75",
    "department_id": "66b6c510-72cc-426d-8d8b-8e738d47b12d",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.112464+00:00"
  },
  {
    "id": "8257eb26-0229-4cbd-92ae-1f884b276b75",
    "department_id": "3b3e5a1a-a94d-4382-b51e-18ae6096b9d3",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "ca5af459-52ab-4cf5-be29-472246865c11",
    "department_id": "f56f5a42-b5f8-4c72-8363-032faa39600c",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "a6b94ac8-cc69-42bd-8d64-74f5e9579007",
    "department_id": "c3d8d41f-cb6b-42d2-9026-339da5b7ffe8",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "eb7fd870-7a1a-4dca-b538-6f49c5fe1aa9",
    "department_id": "9141d4dc-63ab-4deb-b1a3-dedb3af0da5e",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "c821d8fd-4416-4a04-b331-19e3fd206c2b",
    "department_id": "c0f77174-9c35-42b1-8e63-a95a9afae25a",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.767654+00:00"
  },
  {
    "id": "0050a076-90cd-4514-979f-53011b396b02",
    "department_id": "da081e85-f648-45d1-8938-94d9b53d1190",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "332d778b-6e16-4311-86c3-964db33af596",
    "department_id": "06298975-62e0-45ea-8388-30b05e5c35eb",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "8fd20b3c-bda7-4346-8b6b-d3b872e3c093",
    "department_id": "dca47b11-8a02-4cc0-981f-671896fc3692",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "a3c34cf1-9385-4438-945f-15a4533397b5",
    "department_id": "62a9155d-a40c-4253-9809-c243161a89b4",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.808185+00:00"
  },
  {
    "id": "5d2e89e9-25e8-43a5-97ff-729418ffc37a",
    "department_id": "3b2de3b7-070f-45aa-bf5c-5ca5834be202",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "POSTGRADUATE",
    "created_at": "2026-09-06T07:32:39.596547+00:00"
  },
  {
    "id": "1063d9cc-b704-4c11-8fa3-2b49d22422bf",
    "department_id": "8d458a1b-c28f-40a4-9be8-84f6c2e58b11",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "6abd0841-b1fe-46c6-a819-021f7374a7bc",
    "department_id": "33c6aaed-63c0-465f-8608-3da4df8cfc91",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "51fff18e-c40c-4a30-a04c-33aeea98e3ad",
    "department_id": "14cbe224-5a00-4ab8-9c40-6dd22f33a747",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "16aa9568-5d7a-4dbf-bf80-5fe50911b40b",
    "department_id": "7289d7b1-df7a-4fe7-a2ae-cd55c9bd29ce",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.4664+00:00"
  },
  {
    "id": "6947efde-bb42-4e42-a157-a81317cd4913",
    "department_id": "60c3b366-a794-4ba5-ac02-f3e15be2ea4f",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "f8dd3dde-49c6-458e-8e6a-95d4bfb00508",
    "department_id": "ceeaed66-bf35-499e-9497-8cdc689444e6",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:05.007475+00:00"
  },
  {
    "id": "1a4d23f1-7815-40e4-83fa-11871d0c336a",
    "department_id": "e77b8c4a-ec42-45dc-b513-ad33a5329d8f",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "78541b49-36a6-455a-99cf-ffee91f6a706",
    "department_id": "652a6d57-53cc-4adf-ad5a-5dd1d7a2d271",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.693186+00:00"
  },
  {
    "id": "8b4648b6-eebd-4f46-8a59-7abed513fc8e",
    "department_id": "4c59d98f-5f43-4eb9-b507-afaab1b8a12b",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "904917b0-e09b-4a29-b90c-4819a46beda2",
    "department_id": "6133c916-d438-4ab5-ad8c-976df1cccebe",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.70648+00:00"
  },
  {
    "id": "f82404f8-d01e-4940-90f5-dd77fd9ef20b",
    "department_id": "58578c78-38f7-441f-b71f-87e1dee7c04a",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "eb37ff85-2d6c-4559-8888-411c121e570a",
    "department_id": "94dcf306-b0d3-4410-9b09-db7ff6c49f15",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "a60817dc-3929-4565-bcb0-847419ab3549",
    "department_id": "6d1a561c-bd46-451b-a385-1463ce16bbb9",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "4b733004-da1d-4371-8cc8-726eb0fe73d9",
    "department_id": "481b3c3b-02e4-4011-8e8b-e782dddbc19b",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "36c9e489-0077-4b38-b878-717f2a84d6b7",
    "department_id": "a80c86ea-ba91-4218-9178-2d50e472c303",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "fd1de0fc-7535-4a08-93fd-0256b31b8dd5",
    "department_id": "77585fd0-508a-404b-bcb2-58c151c99fcc",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "2d230e94-86d9-4177-a861-c01358962823",
    "department_id": "3b677a48-fb0c-4cc5-a5e9-a90908454fa6",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "b31a2425-15f3-4200-a2b3-ee7ac332b2fa",
    "department_id": "858d7677-6673-472a-be88-4cd8169543e3",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "9f86ec85-868a-405c-bdc6-0f65735845c8",
    "department_id": "d3fe33ea-d836-4172-9030-0dcb5be6f573",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.564455+00:00"
  },
  {
    "id": "3431430e-3437-4576-9185-07d3f36c35d1",
    "department_id": "c49677e2-c1c4-4926-8323-120a3693fe77",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.172963+00:00"
  },
  {
    "id": "ceb18649-9ad5-4afc-a6b9-5112a84cb917",
    "department_id": "975cdfc5-3978-474c-94f1-0b29992fc0c6",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.520902+00:00"
  },
  {
    "id": "6aafe589-d90e-4b40-a77b-aa9defca5a15",
    "department_id": "9b800552-fcc7-4aca-bab9-9e9bdc1618c1",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "0a947526-2749-4e82-89e2-66a57b3f4615",
    "department_id": "60dcb668-2945-4c36-9572-ffea17f04c65",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.569669+00:00"
  },
  {
    "id": "16bd0fcc-b62b-4265-8570-5f1a6da8ccd2",
    "department_id": "674160ce-5053-4c18-96e7-eea7dc74921a",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "572e968d-0f78-4743-b556-1fd14e7a4c57",
    "department_id": "cce044d7-eab4-4652-931a-c0dfaf7bb4e1",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  },
  {
    "id": "87cb3474-6e13-4448-8a35-e1198459152c",
    "department_id": "e9f756da-9cfc-4aa2-ba75-5ae3dbeb2351",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:04.855172+00:00"
  },
  {
    "id": "ff54e623-2b49-4d2f-9e24-3a091e8964e4",
    "department_id": "85eca5f4-0ac2-4e8e-839c-30b72cccbba6",
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS",
    "created_at": "2026-09-06T08:23:03.460998+00:00"
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'd0100000-0000-0000-0000-000000000001',
    permanent_uid: 'STU-2021-00314',
    first_name: 'Rev. David Immanuel',
    last_name: 'Sangma',
    email: 'd.sangma@saiacs.org',
    phone: '+91 97741 02938',
    date_of_birth: '1992-06-15',
    gender: 'Male',
    national_id: '511122223333',
    aadhar_number: '511122223333',
    state: 'Karnataka',
    address: 'SAIACS Campus, 363 Doddagubbi Cross',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    pincode: '560077',
    country: 'India',
    created_at: '2021-08-10T10:00:00Z',
  },
  {
    id: 'd0100000-0000-0000-0000-000000000002',
    permanent_uid: 'STU-2022-00894',
    first_name: 'Deborah',
    last_name: 'Lalthanzami',
    email: 'deborah.l@aics.edu.in',
    phone: '+91 98623 45120',
    date_of_birth: '1998-04-12',
    gender: 'Female',
    national_id: '522233334444',
    aadhar_number: '522233334444',
    state: 'Mizoram',
    city: 'Aizawl',
    country: 'India',
    created_at: '2022-07-15T11:00:00Z',
  },
  {
    id: 'd0100000-0000-0000-0000-000000000003',
    permanent_uid: 'STU-2020-00419',
    first_name: 'Samuel K.',
    last_name: 'Marak',
    email: 'samuel.marak@ubs.edu.in',
    phone: '+91 94230 11223',
    date_of_birth: '1995-09-20',
    gender: 'Male',
    national_id: '533344445555',
    aadhar_number: '533344445555',
    state: 'Maharashtra',
    city: 'Pune',
    country: 'India',
    created_at: '2020-06-10T09:00:00Z',
  },
  {
    id: 'd0100000-0000-0000-0000-000000000004',
    permanent_uid: 'STU-2023-01182',
    first_name: 'Priya',
    last_name: 'Sharma',
    email: 'priya.sharma@cotr.edu.in',
    phone: '+91 98480 33445',
    date_of_birth: '2000-01-15',
    gender: 'Female',
    national_id: '544455556666',
    aadhar_number: '544455556666',
    state: 'Andhra Pradesh',
    city: 'Visakhapatnam',
    country: 'India',
    created_at: '2023-08-01T12:00:00Z',
  },
  {
    id: 'd0100000-0000-0000-0000-000000000005',
    permanent_uid: 'STU-2024-00612',
    first_name: 'Keviseno',
    last_name: 'Angami',
    email: 'keviseno.angami@clte.edu.in',
    phone: '+91 94360 55667',
    date_of_birth: '1999-07-28',
    gender: 'Female',
    national_id: '555566667777',
    aadhar_number: '555566667777',
    state: 'Nagaland',
    city: 'Dimapur',
    country: 'India',
    created_at: '2024-05-18T14:30:00Z',
  },
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    permanent_uid: 'STU-2026-00421',
    first_name: 'Sophia',
    last_name: 'Chen',
    email: 'sophia.chen@student.edu',
    phone: '+1 (555) 234-5678',
    date_of_birth: '2003-05-14',
    gender: 'Female',
    national_id: '987654321012',
    aadhar_number: '987654321012',
    state: 'Karnataka',
    address: '12 Mission Road',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    pincode: '560027',
    country: 'India',
    created_at: '2026-01-10T09:30:00Z',
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    permanent_uid: 'STU-2026-00892',
    first_name: 'Marcus',
    last_name: 'Vance',
    email: 'marcus.vance@student.edu',
    phone: '+1 (555) 345-6789',
    date_of_birth: '2002-11-22',
    gender: 'Male',
    national_id: '876543210987',
    aadhar_number: '876543210987',
    state: 'Kerala',
    address: '45 Seminary Hill',
    city: 'Kottayam',
    district: 'Kottayam',
    pincode: '686001',
    country: 'India',
    created_at: '2026-01-12T14:15:00Z',
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    permanent_uid: 'STU-2026-01044',
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena.rostova@student.edu',
    phone: '+1 (555) 456-7890',
    date_of_birth: '2004-03-08',
    gender: 'Female',
    national_id: '765432109876',
    aadhar_number: '765432109876',
    state: 'Maharashtra',
    address: '89 Biblical Way',
    city: 'Pune',
    district: 'Pune',
    pincode: '411001',
    country: 'India',
    created_at: '2026-01-15T11:00:00Z',
  },
  {
    id: 'b4444444-4444-4444-4444-444444444444',
    permanent_uid: 'STU-2026-01589',
    first_name: 'David',
    last_name: 'Kalu',
    email: 'david.kalu@student.edu',
    phone: '+1 (555) 567-8901',
    date_of_birth: '2001-08-19',
    gender: 'Male',
    // Legacy record without state to test legacy backward compatibility & state-prompting
    created_at: '2026-01-20T16:45:00Z',
  },
  {
    id: 'b5555555-5555-5555-5555-555555555555',
    permanent_uid: 'STU-2026-02110',
    first_name: 'Aisha',
    last_name: 'Patel',
    email: 'aisha.patel@student.edu',
    phone: '+1 (555) 678-9012',
    date_of_birth: '2003-01-30',
    gender: 'Female',
    national_id: '654321098765',
    aadhar_number: '654321098765',
    state: 'Tamil Nadu',
    address: '22 College Road',
    city: 'Chennai',
    district: 'Chennai',
    pincode: '600010',
    country: 'India',
    created_at: '2026-02-01T10:20:00Z',
  },
  {
    id: 'a4dd800d-acd1-4191-8379-c717de7150f7',
    permanent_uid: 'STU-2026-28593',
    first_name: 'Selena',
    last_name: 'Gomez',
    email: 'selenagomez@student.edu',
    phone: '+1 (555) 789-0123',
    date_of_birth: '2004-06-18',
    gender: 'Female',
    // Legacy record without state
    created_at: '2026-09-04T06:13:07.568Z',
  },
];

export const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'e0100000-0000-0000-0000-000000000001',
    registration_number: 'SAIACS/BA/2026/1',
    student_id: 'd0100000-0000-0000-0000-000000000001',
    registration_type: 'PROGRAM_PROGRESSION',
    institution_id: '22222222-2222-2222-2222-222222222222',
    department_id: 'd3333333-3333-3333-3333-333333333333',
    program_id: 'a5555555-5555-5555-5555-555555555555',
    academic_year: '2026-2027',
    status: 'APPROVED',
    notes: 'Doctor of Philosophy (Ph.D) in Intercultural Studies & Missiology • Research: Tribal Eootheology and Indigenous Missional Ecclesiology in Northeast India (1947–2020)',
    created_at: '2024-08-10T09:00:00Z',
    updated_at: '2026-01-15T11:00:00Z',
  },
  {
    id: 'e0100000-0000-0000-0000-000000000002',
    registration_number: 'SAIACS/BA-CM/2023/1',
    student_id: 'd0100000-0000-0000-0000-000000000001',
    registration_type: 'RE_REGISTRATION',
    institution_id: '22222222-2222-2222-2222-222222222222',
    department_id: 'd3333333-3333-3333-3333-333333333333',
    program_id: 'a4444444-4444-4444-4444-444444444444',
    academic_year: '2023-2025',
    status: 'APPROVED',
    notes: 'Master of Theology (M.Th) in World Religions • Conferred with Distinction • Final CGPA: 3.86 / 4.00 • Defended Thesis: Hermeneutics of Hospitality in Post-Colonial Tribal Settlements',
    created_at: '2023-07-20T08:30:00Z',
    updated_at: '2025-05-15T10:00:00Z',
  },
  {
    id: 'e0100000-0000-0000-0000-000000000003',
    registration_number: 'UBS/BA/2020/1',
    student_id: 'd0100000-0000-0000-0000-000000000001',
    registration_type: 'TRANSFER',
    institution_id: '33333333-3333-3333-3333-333333333333',
    department_id: 'd4444444-4444-4444-4444-444444444444',
    program_id: 'a3333333-3333-3333-3333-333333333333',
    academic_year: '2020-2023',
    status: 'APPROVED',
    notes: 'Master of Divinity (M.Div) • Transferred Credits to SAIACS Track • Transfer Verification: 90 Credit Hours transferred & validated under ATA Council Inter-Institutional Exchange Resolution #619',
    created_at: '2020-06-15T09:00:00Z',
    updated_at: '2023-04-20T14:00:00Z',
  },
  {
    id: 'd29d203a-0ac9-4d9a-8330-146c40036cf2',
    registration_number: 'NIBS/BTH/2026/3',
    student_id: 'a4dd800d-acd1-4191-8379-c717de7150f7',
    registration_type: 'INITIAL_REGISTRATION',
    institution_id: '11111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    program_id: 'a1111111-1111-1111-1111-111111111111',
    academic_year: '2026-2027',
    status: 'DRAFT',
    created_at: '2026-09-04T06:13:32.187Z',
    updated_at: '2026-09-04T06:13:32.187Z',
  },
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    registration_number: 'NIBS/BTH/2026/1',
    student_id: 'b1111111-1111-1111-1111-111111111111',
    registration_type: 'INITIAL_REGISTRATION',
    institution_id: '11111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    program_id: 'a1111111-1111-1111-1111-111111111111',
    academic_year: '2026-2027',
    status: 'SUBMITTED',
    notes: 'High school transcripts and identity proof attached.',
    submitted_at: '2026-02-10T10:00:00Z',
    created_at: '2026-02-10T09:15:00Z',
    updated_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    registration_number: 'NIBS/MDIV/2026/1',
    student_id: 'b2222222-2222-2222-2222-222222222222',
    registration_type: 'RE_REGISTRATION',
    institution_id: '11111111-1111-1111-1111-111111111111',
    department_id: 'd2222222-2222-2222-2222-222222222222',
    program_id: 'a3333333-3333-3333-3333-333333333333',
    academic_year: '2026-2027',
    status: 'UNDER_REVIEW',
    notes: 'Continuing student re-registering for Semester 3.',
    submitted_at: '2026-02-12T11:30:00Z',
    created_at: '2026-02-11T14:20:00Z',
    updated_at: '2026-02-13T08:45:00Z',
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    registration_number: 'SAIACS/MTH/2026/1',
    student_id: 'b3333333-3333-3333-3333-333333333333',
    registration_type: 'TRANSFER',
    institution_id: '22222222-2222-2222-2222-222222222222',
    department_id: 'd3333333-3333-3333-3333-333333333333',
    program_id: 'a4444444-4444-4444-4444-444444444444',
    academic_year: '2026-2027',
    status: 'CORRECTION_REQUIRED',
    rejection_reason: 'Previous institution credit evaluation document is missing seal.',
    notes: 'Transfer applicant from State University.',
    submitted_at: '2026-02-05T16:10:00Z',
    reviewed_at: '2026-02-08T09:20:00Z',
    created_at: '2026-02-04T12:00:00Z',
    updated_at: '2026-02-08T09:20:00Z',
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    registration_number: 'UBS/MTH-NT/2026/1',
    student_id: 'b4444444-4444-4444-4444-444444444444',
    registration_type: 'PROGRAM_PROGRESSION',
    institution_id: '33333333-3333-3333-3333-333333333333',
    department_id: 'd4444444-4444-4444-4444-444444444444',
    program_id: 'a5555555-5555-5555-5555-555555555555',
    academic_year: '2026-2027',
    status: 'APPROVED',
    notes: 'Clinical rotation prerequisites cleared.',
    submitted_at: '2026-01-25T14:00:00Z',
    reviewed_at: '2026-01-28T11:00:00Z',
    created_at: '2026-01-24T10:00:00Z',
    updated_at: '2026-01-28T11:00:00Z',
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    registration_number: 'NIBS/DIPTH/2026/1',
    student_id: 'b5555555-5555-5555-5555-555555555555',
    registration_type: 'INITIAL_REGISTRATION',
    institution_id: '11111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    program_id: 'a2222222-2222-2222-2222-222222222222',
    academic_year: '2026-2027',
    status: 'DRAFT',
    notes: 'Draft saved by registrar awaiting final diploma copy.',
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-02-15T09:00:00Z',
  },
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    registration_number: 'NIBS/BTH/2025/1',
    student_id: 'b1111111-1111-1111-1111-111111111111',
    registration_type: 'INITIAL_REGISTRATION',
    institution_id: '11111111-1111-1111-1111-111111111111',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    program_id: 'a1111111-1111-1111-1111-111111111111',
    academic_year: '2025-2026',
    status: 'ARCHIVED',
    notes: 'Previous year completed record.',
    submitted_at: '2025-08-15T10:00:00Z',
    reviewed_at: '2025-08-20T14:00:00Z',
    created_at: '2025-08-10T09:00:00Z',
    updated_at: '2026-01-05T12:00:00Z',
  },
  {
    id: 'c7777777-7777-7777-7777-777777777777',
    registration_number: 'SAIACS/MTH/2026/2',
    student_id: 'b2222222-2222-2222-2222-222222222222',
    registration_type: 'RE_REGISTRATION',
    institution_id: '22222222-2222-2222-2222-222222222222',
    department_id: 'd3333333-3333-3333-3333-333333333333',
    program_id: 'a4444444-4444-4444-4444-444444444444',
    academic_year: '2026-2027',
    status: 'RESUBMITTED',
    notes: 'Resubmitted after providing updated transcript.',
    submitted_at: '2026-02-14T15:30:00Z',
    created_at: '2026-02-02T11:00:00Z',
    updated_at: '2026-02-14T15:30:00Z',
  }
];

// Helper to hydrate joined relation data for mock
export function hydrateRegistration(
  reg: Registration,
  students: Student[],
  institutions: Institution[],
  departments: Department[],
  programs: Program[]
): Registration {
  const student = students.find((s) => s.id === reg.student_id);
  const institution = institutions.find((i) => i.id === reg.institution_id);
  const department = departments.find((d) => d.id === reg.department_id);
  const program = programs.find((p) => p.id === reg.program_id);

  return {
    ...reg,
    student,
    institution,
    department,
    program,
  };
}

const STORAGE_KEYS = {
  STUDENTS: 'ata_students_v1',
  REGISTRATIONS: 'ata_registrations_v1',
};

export const AUTHORITATIVE_CATALOG_PROGRAMS: Array<{ name: string; code: string; degree_level: string }> = [
  {
    "name": "Certificate",
    "code": "CERT",
    "degree_level": "CERTIFICATE"
  },
  {
    "name": "Certificate in Theology",
    "code": "CTH",
    "degree_level": "CERTIFICATE"
  },
  {
    "name": "Certificate in Ministry",
    "code": "CERT-MIN",
    "degree_level": "CERTIFICATE"
  },
  {
    "name": "Certificate of Theology",
    "code": "CTH-CERT",
    "degree_level": "CERTIFICATE"
  },
  {
    "name": "Diploma",
    "code": "DIP",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology",
    "code": "DIPTH",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (English)",
    "code": "DIPTH-ENG",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (English & Kannada)",
    "code": "DIPTH-ENG-KAN",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (English-Campus based program)",
    "code": "DIPTH-ENG-CAM-BAS-PRO",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (English-Residential)",
    "code": "DIPTH-ENG-RES",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (Hindi & English)",
    "code": "DIPTH-HE",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (Malayalam)",
    "code": "DIPTH-MAL",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (Malayalam & English)",
    "code": "DIPTH-MAL-ENG",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (Marati)",
    "code": "DIPTH-MAR",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (Res-English)",
    "code": "DIPTH-RES-ENG",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (Res-Telugu)",
    "code": "DIPTH-RES-TEL",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (Tamil)",
    "code": "DIPTH-TAM",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (Tamil-Res & Extn)",
    "code": "DIPTH-TAM-RES-EXT",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (Telugu & English)",
    "code": "DIPTH-TEL-ENG",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Theology (Residential)",
    "code": "DIPTH-RES",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Bachelor",
    "code": "BACH",
    "degree_level": "BACHELORS"
  },
  {
    "name": "B.R.E",
    "code": "BRE",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Arts in Christian Music",
    "code": "BA-CM",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology",
    "code": "BTH",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Bi-lingual)",
    "code": "BTH-BI-LIN",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Bi-lingual English & Hindi)",
    "code": "BTH-BI-LIN-ENG-HIN",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Distance Learning)",
    "code": "BTH-DL",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (English)",
    "code": "BTH-ENG",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (English-Campus based program)",
    "code": "BTH-ENG-CAM-BAS-PRO",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (English-Res)",
    "code": "BTH-ENG-RES",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (English-Residential)",
    "code": "BTH-ENG-RES-2",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Evening College)",
    "code": "BTH-EVE-COL",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Malayalam)",
    "code": "BTH-MAL",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Malayalam, English)",
    "code": "BTH-MAL-ENG",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Non-residential)",
    "code": "BTH-NON-RES",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Regular)",
    "code": "BTH-REG",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Res)",
    "code": "BTH-RES",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Res & Non-Res)",
    "code": "BTH-RES-NON-RES",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Res-Bilingual [Eng & Telu])",
    "code": "BTRBET",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Res-English)",
    "code": "BTH-RES-ENG",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Residential)",
    "code": "BTH-RES-2",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Tamil)",
    "code": "BTH-TAM",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Tamil-Res & Modular)",
    "code": "BTH-TAM-RES-MOD",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Telugu & English)",
    "code": "BTH-TEL-ENG",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Bi-Lingual - English/Hindi)",
    "code": "BTH-BI-LIN-ENG-HIN-2",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Ministry (Distance Education)",
    "code": "BMIN-DE",
    "degree_level": "BACHELORS"
  },
  {
    "name": "B.A in Christian Ministry & Leadership",
    "code": "BA-CML",
    "degree_level": "BACHELORS"
  },
  {
    "name": "M.R.E",
    "code": "MRE",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master",
    "code": "MAST",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Arts",
    "code": "MA",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Arts (Online)",
    "code": "MA-OL",
    "degree_level": "MASTERS"
  },
  {
    "name": "MA (online)",
    "code": "M-OL",
    "degree_level": "MASTERS"
  },
  {
    "name": "MA in Christian Studies",
    "code": "MCS",
    "degree_level": "MASTERS"
  },
  {
    "name": "MA in Christian Studies (Online)",
    "code": "MCS-OL",
    "degree_level": "MASTERS"
  },
  {
    "name": "MA in Clinical Counseling",
    "code": "MCC",
    "degree_level": "MASTERS"
  },
  {
    "name": "MA in Theological Studies (Advanced)",
    "code": "MTS-ADV",
    "degree_level": "MASTERS"
  },
  {
    "name": "MA in Theological Studies (Advanced) [Online]",
    "code": "MTSA-OL",
    "degree_level": "MASTERS"
  },
  {
    "name": "MA in Theological Studies (Online)",
    "code": "MTS-OL",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Arts in Bible Translation",
    "code": "MABT",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Arts in Christian Studies (MACS)",
    "code": "MACS-MAC",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Arts in Theological Studies (MATS)",
    "code": "MATS-MAT",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Arts in Theology (Online)",
    "code": "MAT-OL",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Biblical Studies",
    "code": "MBS",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity",
    "code": "MDIV",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (DL)",
    "code": "MDIV-DL",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (Distance Education)",
    "code": "MDIV-DE",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (Distance Learning)",
    "code": "MDIV-DIS-LEA",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (English)",
    "code": "MDIV-ENG",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (English-Campus based program)",
    "code": "MDIV-ENG-CAM-BAS-PRO",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (English-Res)",
    "code": "MDIV-ENG-RES",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (English-Res & Modular)",
    "code": "MDIV-ENG-RES-MOD",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (English-Residential)",
    "code": "MDIV-ENG-RES-2",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (evening college)",
    "code": "MDIV-EVE-COL",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (Ext)",
    "code": "MDIV-EXT",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (Extn)",
    "code": "MDIV-EXT-2",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (Hybrid-English)",
    "code": "MDIV-HYB-ENG",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (Online)",
    "code": "MDIV-OL",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (Res & DL)",
    "code": "MDIV-RES-DL",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (Res & Semi-Res)",
    "code": "MDIV-RES-SEM-RES",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity (Residential)",
    "code": "MDIV-RES",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity in Biblical Studies",
    "code": "MDIV-BS",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity in Christian Counseling",
    "code": "MDIV-CC",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity in Christian Ministry",
    "code": "MDIV-CM",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity in Missions",
    "code": "MDIV-M",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity in New Testament",
    "code": "MDIV-NT",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Divinity in Old Testament",
    "code": "MDIV-OT",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology",
    "code": "MTH",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology (DL)",
    "code": "MTH-DL",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Christian Ethics",
    "code": "MTH-CE",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Christian History",
    "code": "MTH-CH",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Christian Theology",
    "code": "MTH-CT",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Church History",
    "code": "MTH-CH-CHURCH",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in History of Christianity",
    "code": "MTH-HC",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Missiology",
    "code": "MTH-MIS",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Mission & Ministry",
    "code": "MTH-MM",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Mission Studies",
    "code": "MTH-MS",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in New Testament",
    "code": "MTH-NT",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Old Testament",
    "code": "MTH-OT",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Pastoral Care & Counselling",
    "code": "MTH-PCC",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Pastoral Counseling",
    "code": "MTH-PC",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Pastoral Theology",
    "code": "MTH-PT",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Pastoral Theology & Counseling",
    "code": "MTH-PTC",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Practical Theology",
    "code": "MTH-PT-PRAC",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology in Religion and Philosophy (DL)",
    "code": "MTRP-DL",
    "degree_level": "MASTERS"
  },
  {
    "name": "Master of Theology-Integrated",
    "code": "IMTH-ALT",
    "degree_level": "MASTERS"
  },
  {
    "name": "Postgraduate",
    "code": "PG",
    "degree_level": "POSTGRADUATE"
  },
  {
    "name": "PG Dip in Biblical Studies",
    "code": "PGDBS",
    "degree_level": "POSTGRADUATE"
  },
  {
    "name": "PG Diploma",
    "code": "PGD",
    "degree_level": "POSTGRADUATE"
  },
  {
    "name": "PG Diploma (Online)",
    "code": "PGD-OL",
    "degree_level": "POSTGRADUATE"
  },
  {
    "name": "Doctoral",
    "code": "DOC",
    "degree_level": "DOCTORAL"
  },
  {
    "name": "Doctor of Ministry",
    "code": "DMIN",
    "degree_level": "DOCTORAL"
  },
  {
    "name": "Doctor of Ministry (DL)",
    "code": "DMIN-DL",
    "degree_level": "DOCTORAL"
  },
  {
    "name": "Doctor of Ministry (Online)",
    "code": "DMIN-OL",
    "degree_level": "DOCTORAL"
  },
  {
    "name": "Doctor of Philosophy (Integrated)",
    "code": "DP-INT",
    "degree_level": "DOCTORAL"
  },
  {
    "name": "Doctor of Philosophy (PhD)",
    "code": "PHD",
    "degree_level": "DOCTORAL"
  },
  {
    "name": "Doctor of Theology",
    "code": "DTH",
    "degree_level": "DOCTORAL"
  },
  {
    "name": "PhD in Intercultural Studies",
    "code": "PHD-ICS",
    "degree_level": "DOCTORAL"
  },
  {
    "name": "PhD in New Testament",
    "code": "PHD-NT",
    "degree_level": "DOCTORAL"
  },
  {
    "name": "PhD in Theology",
    "code": "PHD-THEO",
    "degree_level": "DOCTORAL"
  },
  {
    "name": "Integrated PhD",
    "code": "INT-PHD",
    "degree_level": "UNDERGRADUATE"
  },
  {
    "name": "Certificate in Theology (Hindi)",
    "code": "CTH-HI",
    "degree_level": "CERTIFICATE"
  },
  {
    "name": "Certificate in Theology (Res-English)",
    "code": "CTH-RES-ENG",
    "degree_level": "CERTIFICATE"
  },
  {
    "name": "Certificate in Pracharak Studies (Hindi)",
    "code": "CPS-HIN",
    "degree_level": "CERTIFICATE"
  },
  {
    "name": "Diploma in Christian Ministry",
    "code": "DIP-CM",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Diploma in Christian Ministry (English & Tamil)",
    "code": "DIP-CM-ET",
    "degree_level": "DIPLOMA"
  },
  {
    "name": "Bachelor of Arts",
    "code": "BA",
    "degree_level": "BACHELORS"
  },
  {
    "name": "Bachelor of Theology (Distance Education)",
    "code": "BTH-DE",
    "degree_level": "BACHELORS"
  }
];

class LocalFallbackStore {
  private students: Student[] = [];
  private registrations: Registration[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (storedStudents) {
        try {
          this.students = JSON.parse(storedStudents);
        } catch {
          this.students = [...INITIAL_STUDENTS];
        }
      } else {
        this.students = [...INITIAL_STUDENTS];
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
      }

      const storedRegs = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
      if (storedRegs) {
        try {
          this.registrations = JSON.parse(storedRegs);
        } catch {
          this.registrations = [...INITIAL_REGISTRATIONS];
        }
      } else {
        this.registrations = [...INITIAL_REGISTRATIONS];
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(this.registrations));
      }
    } else {
      this.students = [...INITIAL_STUDENTS];
      this.registrations = [...INITIAL_REGISTRATIONS];
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(this.registrations));
    }
  }

  getInstitutions(): Institution[] {
    return INITIAL_INSTITUTIONS;
  }

  getDepartments(institutionId?: string): Department[] {
    if (institutionId) {
      return INITIAL_DEPARTMENTS.filter((d) => d.institution_id === institutionId);
    }
    return INITIAL_DEPARTMENTS;
  }

  getPrograms(departmentId?: string): Program[] {
    if (departmentId) {
      const existing = INITIAL_PROGRAMS.filter((p) => p.department_id === departmentId);
      if (existing.length >= AUTHORITATIVE_CATALOG_PROGRAMS.length) {
        return existing;
      }
      const existingCodes = new Set(existing.map((p) => p.code));
      const generated = AUTHORITATIVE_CATALOG_PROGRAMS.filter((c) => !existingCodes.has(c.code)).map((c, idx) => ({
        id: `prog-${departmentId}-${c.code}`,
        department_id: departmentId,
        name: c.name,
        code: c.code,
        degree_level: c.degree_level,
        created_at: new Date().toISOString(),
      }));
      return [...existing, ...generated].sort((a, b) => a.name.localeCompare(b.name));
    }
    return INITIAL_PROGRAMS;
  }

  getStudents(actor?: ActorContext): Student[] {
    if (actor?.role === 'REGISTRAR') {
      if (!actor.institutionId) return [];
      const instRegs = this.registrations.filter((r) => r.institution_id === actor.institutionId);
      const validStudentIds = new Set(instRegs.map((r) => r.student_id));
      return this.students.filter((s) => validStudentIds.has(s.id));
    }
    return [...this.students];
  }

  getStudentById(idOrUid: string, actor?: ActorContext): Student | null {
    const s = this.students.find((stu) => stu.id === idOrUid || stu.permanent_uid === idOrUid);
    if (!s) return null;
    if (actor?.role === 'REGISTRAR') {
      if (!actor.institutionId) return null;
      const hasRegInInst = this.registrations.some(
        (r) => r.student_id === s.id && r.institution_id === actor.institutionId
      );
      if (!hasRegInInst) return null;
    }
    return s;
  }

  searchStudents(query: string, actor?: ActorContext): Student[] {
    const q = query.toLowerCase().trim();
    const studentsList = this.getStudents(actor);
    if (!q) return studentsList;
    const normQ = normalizeAadhar(query);

    return studentsList.filter(
      (s) => {
        const matchesStandard =
          s.permanent_uid.toLowerCase().includes(q) ||
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.phone && s.phone.toLowerCase().includes(q)) ||
          (s.state && s.state.toLowerCase().includes(q));

        if (matchesStandard) return true;

        const aadhar = s.national_id || s.aadhar_number;
        if (!aadhar) return false;

        // Exact normalized match in application code (no fuzzy or partial Aadhar matching)
        if (normQ && isAadharMatch(aadhar, normQ)) return true;

        return false;
      }
    );
  }

  generatePermanentStudentUid(year: number): string {
    const existingUids = this.students.map((s) => s.permanent_uid).filter(Boolean);
    return findLowestUnusedUidSequence(existingUids, year);
  }

  createStudent(
    data: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'permanent_uid'> & {
      permanent_uid?: string;
    },
    intakeYear?: number,
    actor?: ActorContext
  ): Student {
    if (actor?.role === 'ADMINISTRATOR') {
      throw new Error('403 Forbidden: Administrators cannot create student records.');
    }
    if (actor?.role === 'UNIVERSAL') {
      throw new Error('403 Forbidden: Universal role is read-only and cannot create students.');
    }

    if (!data.first_name || !data.first_name.trim()) throw new Error('First Name is required');
    if (!data.last_name || !data.last_name.trim()) throw new Error('Last Name is required');
    if (!data.email || !data.email.trim()) throw new Error('Email Address is required');
    if (!data.state || !data.state.trim()) throw new Error('State is required for student registration');
    if (!data.phone || !data.phone.trim()) throw new Error('Phone Number is required for student registration');
    if (!data.date_of_birth) throw new Error('Date of Birth is required for student registration');

    const nationalId = data.aadhar_number?.trim() || data.national_id?.trim() || undefined;
    if (!nationalId) throw new Error('Aadhar Number / National ID is required for student registration');

    if (!data.country || !data.country.trim()) throw new Error('Country is required for student registration');
    if (!data.address || !data.address.trim()) throw new Error('Street Address is required for student registration');
    if (!data.city || !data.city.trim()) throw new Error('City / Town is required for student registration');
    if (!data.pincode || !data.pincode.trim()) throw new Error('PIN Code / Postal Code is required for student registration');

    // Duplicate check: email
    const existingByEmail = this.students.find(
      (s) => s.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (existingByEmail) {
      throw new Error('A student with this email address already exists. Please select the existing student record.');
    }

    // Duplicate check: Aadhar
    const normAadhar = normalizeAadhar(nationalId);
    if (normAadhar) {
      const existingByAadhar = this.students.find((s) =>
        isAadharMatch(s.national_id || s.aadhar_number, normAadhar)
      );
      if (existingByAadhar) {
        throw new Error(
          `A student with this Aadhar Number (Aadhar ending in ${maskAadhar(normAadhar)}) already exists (${existingByAadhar.permanent_uid}). Please select the existing student record.`
        );
      }
    }

    const year = intakeYear || new Date().getFullYear();
    const permanentUid = data.permanent_uid?.trim() || this.generatePermanentStudentUid(year);


    const newStudent: Student = {
      ...data,
      permanent_uid: permanentUid,
      national_id: nationalId,
      aadhar_number: nationalId,
      state: data.state.trim(),
      address: data.address?.trim() || undefined,
      city: data.city?.trim() || undefined,
      district: data.district?.trim() || undefined,
      pincode: data.pincode?.trim() || undefined,
      country: data.country?.trim() || 'India',
      alternate_phone: data.alternate_phone?.trim() || undefined,
      alternate_email: data.alternate_email?.trim() || undefined,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `b${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.students.unshift(newStudent);
    this.save();
    return newStudent;
  }

  updateStudent(id: string, updates: Partial<Student>, actor?: ActorContext): Student {
    if (actor?.role === 'ADMINISTRATOR') {
      throw new Error('403 Forbidden: Administrators cannot edit student profiles.');
    }
    if (actor?.role === 'UNIVERSAL') {
      throw new Error('403 Forbidden: Universal role is read-only.');
    }

    const idx = this.students.findIndex((s) => s.id === id || s.permanent_uid === id);
    if (idx === -1) throw new Error('Student not found');

    const current = this.students[idx];
    const nationalId = updates.aadhar_number?.trim() || updates.national_id?.trim() || current.national_id;

    const updated: Student = {
      ...current,
      ...updates,
      national_id: nationalId,
      aadhar_number: nationalId,
      updated_at: new Date().toISOString(),
    };

    this.students[idx] = updated;
    this.save();
    return updated;
  }

  getRegistrations(actor?: ActorContext): Registration[] {
    let list = this.registrations;
    if (actor?.role === 'REGISTRAR') {
      if (!actor.institutionId) return [];
      list = list.filter((r) => r.institution_id === actor.institutionId);
    }
    return list.map((r) =>
      hydrateRegistration(r, this.students, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS)
    );
  }

  getRegistrationById(id: string, actor?: ActorContext): Registration | null {
    const reg = this.registrations.find((r) => r.id === id || r.registration_number === id);
    if (!reg) return null;
    if (actor?.role === 'REGISTRAR') {
      if (!actor.institutionId || reg.institution_id !== actor.institutionId) {
        throw new Error('403 Forbidden: Access denied to other institutions\' registrations.');
      }
    }
    return hydrateRegistration(reg, this.students, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS);
  }

  generateRegistrationId(
    institutionCode: string,
    programCode: string,
    year: number
  ): { registrationNumber: string; sequence: number } {
    const existingRegNumbers = this.registrations.map((r) => r.registration_number).filter(Boolean);
    const { nextSeq, registrationNumber } = findNextRegistrationSequence(
      existingRegNumbers,
      institutionCode,
      programCode,
      year
    );
    return { registrationNumber, sequence: nextSeq };
  }

  createRegistration(data: Partial<Registration>, actor?: ActorContext): Registration {
    if (actor?.role === 'ADMINISTRATOR') {
      throw new Error('403 Forbidden: Administrators are restricted from creating registrations. Registration creation is an operational Registrar action.');
    }
    if (actor?.role === 'UNIVERSAL') {
      throw new Error('403 Forbidden: Universal role is read-only and cannot create registrations.');
    }
    if (actor?.role === 'REGISTRAR') {
      if (!actor.institutionId) {
        throw new Error('403 Forbidden: Registrar has no assigned institution.');
      }
      if (data.institution_id && data.institution_id !== actor.institutionId) {
        throw new Error('403 Forbidden: Registrars can only create registrations for their assigned institution.');
      }
    }

    const now = new Date().toISOString();

    // 1. Validate Master Data Hierarchy & Authoritative Codes
    const inst = INITIAL_INSTITUTIONS.find(
      (i) => i.id === data.institution_id || i.code === data.institution_id || i.name === data.institution_id
    );
    if (!inst) throw new Error(`Institution "${data.institution_id}" not found`);
    if (!inst.code || !inst.code.trim()) throw new Error(`Institution "${inst.name}" is missing an authoritative code`);

    const dept = INITIAL_DEPARTMENTS.find(
      (d) => d.id === data.department_id || d.code === data.department_id || d.name === data.department_id
    );
    if (!dept) throw new Error(`Department "${data.department_id}" not found`);
    if (dept.institution_id !== inst.id) throw new Error(`Department "${dept.name}" does not belong to Institution "${inst.name}"`);
    if (!dept.code || !dept.code.trim()) throw new Error(`Department "${dept.name}" is missing an authoritative code`);

    const prog = INITIAL_PROGRAMS.find(
      (p) => p.id === data.program_id || p.code === data.program_id || p.name === data.program_id
    );
    if (!prog) throw new Error(`Program "${data.program_id}" not found`);
    if (prog.department_id !== dept.id) throw new Error(`Program "${prog.name}" does not belong to Department "${dept.name}"`);
    if (!prog.code || !prog.code.trim()) throw new Error(`Program "${prog.name}" is missing an authoritative code`);

    // 2. Validate Student Profile & State Requirement
    const student = this.students.find((s) => s.id === data.student_id);
    if (!student) throw new Error(`Student with ID "${data.student_id}" not found`);
    if (!student.state || !student.state.trim()) {
      throw new Error('State is required for every new registration. Please update the student profile with their state of residence before proceeding.');
    }

    // 3. Conditional Previous Registration Number
    const regType = data.registration_type || 'INITIAL_REGISTRATION';
    if (regType === 'TRANSFER' || regType === 'RE_REGISTRATION' || regType === 'PROGRAM_PROGRESSION') {
      if (!data.previous_registration_number || !data.previous_registration_number.trim()) {
        throw new Error(`Previous Registration Number is required for ${regType.replace('_', ' ')}.`);
      }
    }


    const year = extractYear(data.academic_year);
    let regNumber = data.registration_number?.trim();
    if (!regNumber) {
      const generated = this.generateRegistrationId(inst.code, prog.code, year);
      regNumber = generated.registrationNumber;
    }

    const newReg: Registration = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c${Date.now()}`,
      registration_number: regNumber,
      student_id: data.student_id!,
      registration_type: regType,
      institution_id: inst.id,
      department_id: dept.id,
      program_id: prog.id,
      academic_year: data.academic_year || `${year}-${year + 1}`,
      status: data.status || 'DRAFT',
      notes: data.notes || '',
      highest_qualification: data.highest_qualification?.trim() || undefined,
      previous_institution: data.previous_institution?.trim() || undefined,
      previous_program: data.previous_program?.trim() || undefined,
      year_of_completion: data.year_of_completion?.trim() || undefined,
      qualification_reg_no: data.qualification_reg_no?.trim() || undefined,
      previous_registration_number: data.previous_registration_number?.trim() || undefined,
      submitted_at: data.status === 'SUBMITTED' ? now : undefined,
      created_at: now,
      updated_at: now,
    };

    this.registrations.unshift(newReg);
    this.save();
    return hydrateRegistration(newReg, this.students, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS);
  }

  updateRegistrationStatus(
    id: string,
    status: WorkflowStatus,
    reasonOrNotes?: string,
    actor?: ActorContext
  ): Registration {
    const idx = this.registrations.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Registration not found');

    const current = this.registrations[idx];

    if (actor?.role === 'UNIVERSAL') {
      throw new Error('403 Forbidden: Universal role is read-only and cannot alter workflow status.');
    }
    if (actor?.role === 'ADMINISTRATOR') {
      if (status === 'RESUBMITTED' || status === 'DRAFT') {
        throw new Error(`403 Forbidden: Administrators cannot perform ${status} operational workflow actions.`);
      }
    }
    if (actor?.role === 'REGISTRAR') {
      if (!actor.institutionId || current.institution_id !== actor.institutionId) {
        throw new Error('403 Forbidden: Cannot alter status of registration belonging to another institution.');
      }
    }

    const now = new Date().toISOString();

    const updated: Registration = {
      ...current,
      status,
      updated_at: now,
    };

    if (status === 'SUBMITTED' || status === 'RESUBMITTED') {
      updated.submitted_at = now;
    }
    if (status === 'APPROVED' || status === 'CORRECTION_REQUIRED') {
      updated.reviewed_at = now;
    }
    if (status === 'CORRECTION_REQUIRED' && reasonOrNotes) {
      updated.rejection_reason = reasonOrNotes;
    }
    if (reasonOrNotes && status !== 'CORRECTION_REQUIRED') {
      updated.notes = reasonOrNotes;
    }

    this.registrations[idx] = updated;
    this.save();
    return hydrateRegistration(updated, this.students, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS);
  }

  updateRegistrationDraft(id: string, data: Partial<Registration>, actor?: ActorContext): Registration {
    const idx = this.registrations.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Registration not found');

    const current = this.registrations[idx];

    if (actor?.role === 'ADMINISTRATOR') {
      throw new Error('403 Forbidden: Administrators cannot edit registration operational details.');
    }
    if (actor?.role === 'UNIVERSAL') {
      throw new Error('403 Forbidden: Universal role is read-only and cannot edit registrations.');
    }
    if (actor?.role === 'REGISTRAR') {
      if (!actor.institutionId || current.institution_id !== actor.institutionId) {
        throw new Error('403 Forbidden: Cannot modify registration belonging to another institution.');
      }
    }

    const now = new Date().toISOString();
    const updated: Registration = {
      ...this.registrations[idx],
      ...data,
      updated_at: now,
    };

    this.registrations[idx] = updated;
    this.save();
    return hydrateRegistration(updated, this.students, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS);
  }

  deleteRegistration(id: string, actor?: ActorContext): void {
    const idx = this.registrations.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const current = this.registrations[idx];

    if (actor?.role === 'ADMINISTRATOR') {
      throw new Error('403 Forbidden: Administrators cannot delete registrations.');
    }
    if (actor?.role === 'UNIVERSAL') {
      throw new Error('403 Forbidden: Universal role is read-only.');
    }
    if (actor?.role === 'REGISTRAR') {
      if (!actor.institutionId || current.institution_id !== actor.institutionId) {
        throw new Error('403 Forbidden: Cannot delete registration belonging to another institution.');
      }
    }

    this.registrations.splice(idx, 1);
    this.save();
  }

  getDashboardMetrics(): DashboardMetrics {
    const hydrated = this.getRegistrations();
    const totalStudents = this.students.length;
    const totalRegistrations = hydrated.length;
    const approvedRegistrations = hydrated.filter((r) => r.status === 'APPROVED').length;
    const archivedRegistrations = hydrated.filter((r) => r.status === 'ARCHIVED').length;
    const attentionRequiredCount = hydrated.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'RESUBMITTED'
    ).length;
    const registrarTasksCount = hydrated.filter(
      (r) => r.status === 'DRAFT' || r.status === 'CORRECTION_REQUIRED'
    ).length;

    const statuses: WorkflowStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'CORRECTION_REQUIRED',
      'RESUBMITTED',
      'APPROVED',
      'ARCHIVED',
    ];

    const statusLabels: Record<WorkflowStatus, { label: string; color: string }> = {
      DRAFT: { label: 'Draft', color: '#64748b' },
      SUBMITTED: { label: 'Submitted', color: '#3b82f6' },
      UNDER_REVIEW: { label: 'Under Review', color: '#8b5cf6' },
      CORRECTION_REQUIRED: { label: 'Correction Required', color: '#f59e0b' },
      RESUBMITTED: { label: 'Resubmitted', color: '#06b6d4' },
      APPROVED: { label: 'Approved', color: '#10b981' },
      GRADUATED: { label: 'Graduated', color: '#059669' },
      COMPLETED: { label: 'Completed', color: '#0d9488' },
      NOT_COMPLETED: { label: 'Not Completed', color: '#ea580c' },
      TRANSFERRED: { label: 'Transferred', color: '#4f46e5' },
      ARCHIVED: { label: 'Archived', color: '#475569' },
    };

    const workflowDistribution = statuses.map((st) => {
      const count = hydrated.filter((r) => r.status === st).length;
      return {
        status: st,
        label: statusLabels[st].label,
        count,
        percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
        color: statusLabels[st].color,
      };
    });

    const regTypes: RegistrationType[] = [
      'INITIAL_REGISTRATION',
      'RE_REGISTRATION',
      'TRANSFER',
      'PROGRAM_PROGRESSION',
    ];

    const typeLabels: Record<RegistrationType, string> = {
      INITIAL_REGISTRATION: 'Initial Registration',
      RE_REGISTRATION: 'Re-Registration',
      TRANSFER: 'Transfer',
      PROGRAM_PROGRESSION: 'Program Progression',
    };

    const registrationTypesDistribution = regTypes.map((t) => {
      const count = hydrated.filter((r) => r.registration_type === t).length;
      return {
        type: t,
        label: typeLabels[t],
        count,
        percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
      };
    });

    const years = Array.from(new Set(hydrated.map((r) => r.academic_year))).sort().reverse();
    const academicYearDistribution = years.map((y) => {
      const count = hydrated.filter((r) => r.academic_year === y).length;
      return {
        year: y,
        count,
        percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
      };
    });

    const institutionDistribution = INITIAL_INSTITUTIONS.map((inst) => {
      const count = hydrated.filter((r) => r.institution_id === inst.id).length;
      return {
        institutionId: inst.id,
        name: inst.name,
        code: inst.code,
        count,
        percentage: totalRegistrations > 0 ? Math.round((count / totalRegistrations) * 100) : 0,
      };
    });

    return {
      totalStudents,
      totalRegistrations,
      approvedRegistrations,
      archivedRegistrations,
      attentionRequiredCount,
      registrarTasksCount,
      workflowDistribution,
      registrationTypesDistribution,
      academicYearDistribution,
      institutionDistribution,
    };
  }
}

export const fallbackStore = new LocalFallbackStore();
