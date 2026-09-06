import React, { useState, useEffect } from 'react';
import {
  Student,
  Registration,
  Institution,
  Department,
  Program,
  RegistrationType,
  WorkflowStatus,
} from '@/lib/types';
import {
  fetchInstitutions,
  fetchDepartments,
  fetchPrograms,
  fetchProgramsForInstitution,
  fetchStudents,
  createStudent,
  updateStudent,
  createRegistration,
  generateRegistrationId,
  getOrCreateInstitution,
  getOrCreateDepartment,
  getOrCreateProgram,
} from '@/lib/api/supabase-service';
import { extractYear } from '@/lib/api/id-generator';
import { maskAadhar } from '@/lib/utils/aadhar';
import {
  Search,
  UserPlus,
  UserCheck,
  CheckCircle2,
  Building2,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  User,
  AlertCircle,
  GraduationCap,
  History,
  MapPin,
  CreditCard,
} from 'lucide-react';

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
  'Other / Outside India',
];


// Extracted from generated arrays
export const INSTITUTION_NAMES = [
  "Academy for Church Planting & Leadership",
  "Academy for Theology and Missions",
  "Academy of Integrated Christian Studies",
  "ACTS Academy of Higher Education",
  "AG Tamilnadu Bible College",
  "AGAPE College",
  "All Nations Theological Seminary",
  "Allahabad Bible Seminary",
  "Amazing Grace Biblical Seminary",
  "Amazing Grace Theological Seminary",
  "Anderson Theological College",
  "Andhra Bible College",
  "Andhra Christian Theological College",
  "Andhra Pradesh Bible College",
  "Antioch Biblical Seminary and College",
  "Antioch Center for Theological Studies",
  "Aroma Bible College",
  "Arunachal Theological college",
  "Asia Antioch Seminary",
  "Asia Evangelical College & Seminary",
  "Asia Graduate School of Theology - North East India (AGST-NEI)",
  "Asia Graduate School of Theology-North East India",
  "Asian Bible College",
  "Asian Christian College of Theology",
  "Baptist Bible College & Seminary",
  "Baptist Seminary of South India",
  "Baptist Theological College & Seminary",
  "Berachah Institute of Higher Education and Research",
  "Berean Baptist Bible College & Seminary",
  "Bethel New Life College",
  "Bethesda Biblical Seminary",
  "Biblical Theological College & Seminary",
  "Brethren Bible Institute",
  "Buntain Theological College",
  "Calcutta Bible College",
  "Calcutta Bible Seminary",
  "Caleb Institute",
  "Calvin Theological College & Seminary",
  "Carmel Bible College",
  "Central India Theological Seminary",
  "Centre for Global Leadership Development (SABC & GSOL)",
  "Chil Chil Baptist College & Seminary",
  "Christ Commission Discipleship Institute",
  "Christ for the Nations Bible College",
  "Christian Academy for Advanced Theological Studies",
  "Christian Leadership Development Centre",
  "Christian Renewal Theological Seminary",
  "Church On The Rock Theological Seminary",
  "City to City India Trust",
  "Clark Theological College",
  "Compel Outreach Bible College",
  "Cornerstone Bible College & Training Centre",
  "Covenant Institute of Theology and Mission",
  "Covenant International Bible College",
  "Delhi Bible Institute",
  "Discipleship Bible College",
  "Discipleship Theological Seminary",
  "Dobam Theological College",
  "Doon Bible College",
  "Doulos Bible Institute",
  "Doulos Theological College",
  "Eastern Bible College",
  "Eastern Theological College",
  "Eastern Theological Institute & Seminary",
  "Ebenezer Bible College",
  "Ebenezer Theological Seminary",
  "Ecclesia Theological College & Seminary",
  "Evangelical College of Theology",
  "Evangelical Theological Seminary",
  "Faith Baptist Bible College & Seminary",
  "Faith Theological Seminary",
  "Federated Theology Program of North East India (FTP – NEI)",
  "Filadelfia Institute of Global Studies (FIGS)",
  "Focus India Theological College",
  "Full Gospel Bible College",
  "Global Leadership Training Centre",
  "Golden Crown Theological College",
  "Grace Bible College",
  "Great Harvest Theological Institute",
  "Green Pastures Theological Centre",
  "Harvest Bible",
  "Harvest Bible College",
  "Harvest Mission Bible College",
  "Harvest Mission College",
  "Harvesters Theological College & Seminary",
  "Hebron Gospel Theological College & Seminary",
  "Heritage Baptist Bible College & Seminary",
  "Himalayan Institute of Leadership Training",
  "Hindustan Bible Institute & College",
  "Huldah Buntain Theological College",
  "Hyderabad Bible College",
  "Hyderabad Institute of Theology and Apologetics",
  "Ichthoos Bible College",
  "Immanuel Theological Seminary",
  "India Baptist Theological Seminary",
  "India Bible College & Seminary",
  "India Centre for Leadership",
  "India Christian Bible College",
  "India Full Gospel Bible College",
  "India Graduate School of Missiology",
  "India St. Thomas Bible College & Seminary",
  "Institute for Biblical Studies",
  "IPC Theological Seminary",
  "John's Leadership Institute",
  "Jubilee Memorial Bible College",
  "Karnataka Bible College",
  "Karunya Academy for Theological Education (KATE)",
  "Kerala Baptist Bible College & Seminary",
  "Kerala Christian Theological Seminary",
  "Kihoto Theological College",
  "Kor-In Theological College & Seminary",
  "Lakeview Bible College and Seminary",
  "Lamb's Institute of Field Evangelism",
  "Lamb’s Institute of Field Evangelism",
  "Leadership Theological College International",
  "Life Theological Seminary",
  "Life Transforming College International",
  "Living Bible College",
  "Living Hope Theological Seminary",
  "Logos College",
  "Logos College of Advanced Studies",
  "Madras AG Bible College",
  "Madras Assemblies of God Bible College",
  "Madras Theological Seminary & College",
  "Maharastra Bible college",
  "Mahima Bible Institute",
  "Manna Bible College",
  "Maranatha Biblical Seminary",
  "Maranatha Theological Seminary",
  "Maranatha Veda Patasala",
  "Mission India Bible college",
  "Mission India Theological Seminary",
  "Mizoram Bible College",
  "Mt Terogvu Theological College",
  "Mt. Terogvu Theological College",
  "Mt. Zion Bible Seminary",
  "Nagaland Baptist College",
  "Nagaland Bible College",
  "Native Evangelical School of Theology",
  "Nav Bharat Bible Institute",
  "Navin Doman Theological College",
  "New Creation Theological Academy",
  "New Hope Bible College",
  "New India Bible Seminary",
  "New life Bible College",
  "New Life Biblical Seminary",
  "New Life College",
  "New Life School of Mission",
  "New Theological College",
  "Ngulhao Theological Seminary",
  "Nichols-Roy Bible College",
  "Nito Theological College",
  "North East India Baptist Bible College & Seminary",
  "North East Theological Seminary",
  "North India College of Christian Studies",
  "North India Institute of Theological Studies",
  "Oriental Theological College",
  "Oriental Theological Seminary",
  "Peniel Bible Seminary",
  "Presbyterian Theological Seminary",
  "Punjab Bible College",
  "Reachout Theological Seminary",
  "Rehoboth Theological Institute",
  "Restoration Theological College",
  "Rhema Bible College and Seminary",
  "Rhema Revival Bible College",
  "Sathya Veda Seminary",
  "SATYA VACHAN SEMINARY",
  "Servanthood Bible College",
  "Shalom Bible College",
  "Shalom Bible Seminary",
  "Sharon Bible College",
  "Shiloh Baptist Bible College & Seminary",
  "Sielmat Bible College",
  "South Asia Institute of Advanced Christian Studies (SAIACS)",
  "South Asia Leadership Training and Development Centre, (SALT-DC)",
  "South Asia Nazarene Bible College",
  "South Asia Theological College and Seminary",
  "South Asian Institute for Leadership and Cultural Studies (SAILCS)",
  "South India Baptist Bible College & Seminary",
  "South India Bible Seminary, (SIBS)",
  "Southern Asia Leadership Institute",
  "Southern Bible College",
  "St. Ignatius Theological Seminary",
  "Susamachar Theological College & Seminary - Copy",
  "Susamachar Theological College and Seminary",
  "The Salvation Army Human Resource Development Department in India",
  "The Word for The World International",
  "Trinity Bible College",
  "Trinity Christian College",
  "Trinity College and Seminary",
  "Trinity Theological College",
  "Trivandrum Biblical Seminary",
  "True Light for Asia Biblical Seminary",
  "UIM-Family Research Training Institute (UIM-FRTI)",
  "Union Biblical Seminary",
  "United College of Theology & Missions",
  "Universal Institute of Truth",
  "Vellore Bible College",
  "Vision Theological Seminary",
  "Witter Bible College",
  "Zion Bible College"
];

export const DEPARTMENT_NAMES = [
  'Theology',
  'Biblical Studies',
  'Old Testament Studies',
  'New Testament Studies',
  'Practical Theology',
  'Pastoral Theology',
  'Pastoral Care & Counseling',
  'Christian History',
  'Christian Ethics',
  'Missiology',
  'Mission Studies',
  'Christian Education',
  'Religion & Philosophy',
  'Christian Ministry',
  'Christian Leadership',
  'Intercultural Studies',
];

export const PROGRAM_NAMES= [
  "B.A in Christian Ministry & Leadership",
  "B.R.E",
  "Bachelor",
  "Bachelor of Arts",
  "Bachelor of Arts in Christian Music",
  "Bachelor of Ministry (Distance Education)",
  "Bachelor of Theology",
  "Bachelor of Theology (Bi-Lingual - English/Hindi)",
  "Bachelor of Theology (Bi-lingual English & Hindi)",
  "Bachelor of Theology (Bi-lingual)",
  "Bachelor of Theology (Distance Education)",
  "Bachelor of Theology (Distance Learning)",
  "Bachelor of Theology (English-Campus based program)",
  "Bachelor of Theology (English-Res)",
  "Bachelor of Theology (English-Residential)",
  "Bachelor of Theology (English)",
  "Bachelor of Theology (Evening College)",
  "Bachelor of Theology (Malayalam, English)",
  "Bachelor of Theology (Malayalam)",
  "Bachelor of Theology (Non-residential)",
  "Bachelor of Theology (Regular)",
  "Bachelor of Theology (Res & Non-Res)",
  "Bachelor of Theology (Res-Bilingual [Eng & Telu])",
  "Bachelor of Theology (Res-English)",
  "Bachelor of Theology (Res)",
  "Bachelor of Theology (Residential)",
  "Bachelor of Theology (Tamil-Res & Modular)",
  "Bachelor of Theology (Tamil)",
  "Bachelor of Theology (Telugu & English)",
  "Certificate",
  "Certificate in Ministry",
  "Certificate in Pracharak Studies (Hindi)",
  "Certificate in Theology",
  "Certificate in Theology (Hindi)",
  "Certificate in Theology (Res-English)",
  "Certificate of Theology",
  "Diploma",
  "Diploma in Christian Ministry",
  "Diploma in Christian Ministry (English & Tamil)",
  "Diploma in Theology",
  "Diploma in Theology (English & Kannada)",
  "Diploma in Theology (English-Campus based program)",
  "Diploma in Theology (English-Residential)",
  "Diploma in Theology (English)",
  "Diploma in Theology (Hindi & English)",
  "Diploma in Theology (Malayalam & English)",
  "Diploma in Theology (Malayalam)",
  "Diploma in Theology (Marati)",
  "Diploma in Theology (Res-English)",
  "Diploma in Theology (Res-Telugu)",
  "Diploma in Theology (Residential)",
  "Diploma in Theology (Tamil-Res & Extn)",
  "Diploma in Theology (Tamil)",
  "Diploma in Theology (Telugu & English)",
  "Doctor of Ministry",
  "Doctor of Ministry (DL)",
  "Doctor of Ministry (Online)",
  "Doctor of Philosophy (Integrated)",
  "Doctor of Philosophy (PhD)",
  "Doctor of Theology",
  "Doctoral",
  "Integrated PhD",
  "M.R.E",
  "MA (online)",
  "MA in Christian Studies",
  "MA in Christian Studies (Online)",
  "MA in Clinical Counseling",
  "MA in Theological Studies (Advanced)",
  "MA in Theological Studies (Advanced) [Online]",
  "MA in Theological Studies (Online)",
  "Master",
  "Master of Arts",
  "Master of Arts (Online)",
  "Master of Arts in Bible Translation",
  "Master of Arts in Christian Studies (MACS)",
  "Master of Arts in Theological Studies (MATS)",
  "Master of Arts in Theology (Online)",
  "Master of Biblical Studies",
  "Master of Divinity",
  "Master of Divinity (Distance Education)",
  "Master of Divinity (Distance Learning)",
  "Master of Divinity (DL)",
  "Master of Divinity (English-Campus based program)",
  "Master of Divinity (English-Res & Modular)",
  "Master of Divinity (English-Res)",
  "Master of Divinity (English-Residential)",
  "Master of Divinity (English)",
  "Master of Divinity (evening college)",
  "Master of Divinity (Ext)",
  "Master of Divinity (Extn)",
  "Master of Divinity (Hybrid-English)",
  "Master of Divinity (Online)",
  "Master of Divinity (Res & DL)",
  "Master of Divinity (Res & Semi-Res)",
  "Master of Divinity (Residential)",
  "Master of Divinity in Biblical Studies",
  "Master of Divinity in Christian Counseling",
  "Master of Divinity in Christian Ministry",
  "Master of Divinity in Missions",
  "Master of Divinity in New Testament",
  "Master of Divinity in Old Testament",
  "Master of Theology",
  "Master of Theology (DL)",
  "Master of Theology in Christian Ethics",
  "Master of Theology in Christian History",
  "Master of Theology in Christian Theology",
  "Master of Theology in Church History",
  "Master of Theology in History of Christianity",
  "Master of Theology in Missiology",
  "Master of Theology in Mission & Ministry",
  "Master of Theology in Mission Studies",
  "Master of Theology in New Testament",
  "Master of Theology in Old Testament",
  "Master of Theology in Pastoral Care & Counselling",
  "Master of Theology in Pastoral Counseling",
  "Master of Theology in Pastoral Theology",
  "Master of Theology in Pastoral Theology & Counseling",
  "Master of Theology in Practical Theology",
  "Master of Theology in Religion and Philosophy (DL)",
  "Master of Theology-Integrated",
  "PG Dip in Biblical Studies",
  "PG Diploma",
  "PG Diploma (Online)",
  "PhD in Intercultural Studies",
  "PhD in New Testament",
  "PhD in Theology",
  "Postgraduate"
];

export const HIGHEST_QUALIFICATION_OPTIONS = [
  'Certificate',
  'Diploma',
  'Bachelor',
  'Bachelor of Arts',
  'Bachelor of Ministry',
  'Bachelor of Theology',
  'B.R.E',
  'Master',
  'Master of Arts',
  'Master of Biblical Studies',
  'Master of Divinity',
  'Master of Theology',
  'M.R.E',
  'Postgraduate Diploma',
  'Doctor of Ministry',
  'Doctor of Philosophy',
  'Doctor of Theology',
  'PhD',
  'Integrated PhD',
  'Other',
];

export const PREVIOUS_PROGRAMS_BY_CATEGORY: Record<string, string[]> = {
  "Certificate": [
    "Certificate",
    "Certificate in Ministry",
    "Certificate in Pracharak Studies (Hindi)",
    "Certificate in Theology",
    "Certificate in Theology (Hindi)",
    "Certificate in Theology (Res-English)",
    "Certificate of Theology"
  ],
  "Diploma": [
    "Diploma",
    "Diploma in Christian Ministry",
    "Diploma in Christian Ministry (English & Tamil)",
    "Diploma in Theology",
    "Diploma in Theology (English & Kannada)",
    "Diploma in Theology (English-Campus based program)",
    "Diploma in Theology (English-Residential)",
    "Diploma in Theology (English)",
    "Diploma in Theology (Hindi & English)",
    "Diploma in Theology (Malayalam & English)",
    "Diploma in Theology (Malayalam)",
    "Diploma in Theology (Marati)",
    "Diploma in Theology (Res-English)",
    "Diploma in Theology (Res-Telugu)",
    "Diploma in Theology (Residential)",
    "Diploma in Theology (Tamil-Res & Extn)",
    "Diploma in Theology (Tamil)",
    "Diploma in Theology (Telugu & English)"
  ],
  "Bachelor": [
    "B.A in Christian Ministry & Leadership",
    "B.R.E",
    "Bachelor",
    "Bachelor of Arts",
    "Bachelor of Arts in Christian Music",
    "Bachelor of Ministry (Distance Education)",
    "Bachelor of Theology",
    "Bachelor of Theology (Bi-Lingual - English/Hindi)",
    "Bachelor of Theology (Bi-lingual English & Hindi)",
    "Bachelor of Theology (Bi-lingual)",
    "Bachelor of Theology (Distance Education)",
    "Bachelor of Theology (Distance Learning)",
    "Bachelor of Theology (English-Campus based program)",
    "Bachelor of Theology (English-Res)",
    "Bachelor of Theology (English-Residential)",
    "Bachelor of Theology (English)",
    "Bachelor of Theology (Evening College)",
    "Bachelor of Theology (Malayalam, English)",
    "Bachelor of Theology (Malayalam)",
    "Bachelor of Theology (Non-residential)",
    "Bachelor of Theology (Regular)",
    "Bachelor of Theology (Res & Non-Res)",
    "Bachelor of Theology (Res-Bilingual [Eng & Telu])",
    "Bachelor of Theology (Res-English)",
    "Bachelor of Theology (Res)",
    "Bachelor of Theology (Residential)",
    "Bachelor of Theology (Tamil-Res & Modular)",
    "Bachelor of Theology (Tamil)",
    "Bachelor of Theology (Telugu & English)",
    "Integrated PhD"
  ],
  "Master of Arts": [
    "MA (online)",
    "MA in Christian Studies",
    "MA in Christian Studies (Online)",
    "MA in Clinical Counseling",
    "MA in Theological Studies (Advanced)",
    "MA in Theological Studies (Advanced) [Online]",
    "MA in Theological Studies (Online)",
    "Master",
    "Master of Arts",
    "Master of Arts (Online)",
    "Master of Arts in Bible Translation",
    "Master of Arts in Christian Studies (MACS)",
    "Master of Arts in Theological Studies (MATS)",
    "Master of Arts in Theology (Online)"
  ],
  "Master of Biblical Studies": [
    "Master of Biblical Studies"
  ],
  "Master of Divinity": [
    "Master of Divinity",
    "Master of Divinity (Distance Education)",
    "Master of Divinity (Distance Learning)",
    "Master of Divinity (DL)",
    "Master of Divinity (English-Campus based program)",
    "Master of Divinity (English-Res & Modular)",
    "Master of Divinity (English-Res)",
    "Master of Divinity (English-Residential)",
    "Master of Divinity (English)",
    "Master of Divinity (evening college)",
    "Master of Divinity (Ext)",
    "Master of Divinity (Extn)",
    "Master of Divinity (Hybrid-English)",
    "Master of Divinity (Online)",
    "Master of Divinity (Res & DL)",
    "Master of Divinity (Res & Semi-Res)",
    "Master of Divinity (Residential)",
    "Master of Divinity in Biblical Studies",
    "Master of Divinity in Christian Counseling",
    "Master of Divinity in Christian Ministry",
    "Master of Divinity in Missions",
    "Master of Divinity in New Testament",
    "Master of Divinity in Old Testament"
  ],
  "Master of Theology": [
    "M.R.E",
    "Master of Theology",
    "Master of Theology (DL)",
    "Master of Theology in Christian Ethics",
    "Master of Theology in Christian History",
    "Master of Theology in Christian Theology",
    "Master of Theology in Church History",
    "Master of Theology in History of Christianity",
    "Master of Theology in Missiology",
    "Master of Theology in Mission & Ministry",
    "Master of Theology in Mission Studies",
    "Master of Theology in New Testament",
    "Master of Theology in Old Testament",
    "Master of Theology in Pastoral Care & Counselling",
    "Master of Theology in Pastoral Counseling",
    "Master of Theology in Pastoral Theology",
    "Master of Theology in Pastoral Theology & Counseling",
    "Master of Theology in Practical Theology",
    "Master of Theology in Religion and Philosophy (DL)",
    "Master of Theology-Integrated"
  ],
  "Postgraduate": [
    "PG Dip in Biblical Studies",
    "PG Diploma",
    "PG Diploma (Online)",
    "Postgraduate"
  ],
  "Doctoral": [
    "Doctor of Ministry",
    "Doctor of Ministry (DL)",
    "Doctor of Ministry (Online)",
    "Doctor of Philosophy (Integrated)",
    "Doctor of Philosophy (PhD)",
    "Doctor of Theology",
    "Doctoral",
    "PhD in Intercultural Studies",
    "PhD in New Testament",
    "PhD in Theology"
  ]
};

export const ALL_PREVIOUS_PROGRAM_OPTIONS = Array.from(
  new Set(Object.values(PREVIOUS_PROGRAMS_BY_CATEGORY).flat())
);

export function getCategoriesForHighestQualification(highestQual: string): string[] {
  switch (highestQual) {
    case 'Certificate':
      return ['Certificate'];
    case 'Diploma':
      return ['Diploma'];
    case 'Bachelor':
    case 'Bachelor of Arts':
    case 'Bachelor of Ministry':
    case 'Bachelor of Theology':
    case 'B.R.E':
      return ['Bachelor'];
    case 'Master of Arts':
      return ['Master of Arts'];
    case 'Master of Biblical Studies':
      return ['Master of Biblical Studies'];
    case 'Master of Divinity':
      return ['Master of Divinity'];
    case 'Master of Theology':
    case 'M.R.E':
      return ['Master of Theology'];
    case 'Master':
      return ['Master of Arts', 'Master of Biblical Studies', 'Master of Divinity', 'Master of Theology'];
    case 'Postgraduate Diploma':
      return ['Postgraduate'];
    case 'Doctor of Ministry':
    case 'Doctor of Philosophy':
    case 'Doctor of Theology':
    case 'PhD':
    case 'Integrated PhD':
      return ['Doctoral'];
    default:
      return Object.keys(PREVIOUS_PROGRAMS_BY_CATEGORY);
  }
}

interface NewRegistrationWizardProps {
  onCancel: () => void;
  onSuccess: (reg: Registration) => void;
  initialStudent?: Student | null;
  defaultRegistrationType?: RegistrationType;
}

export const NewRegistrationWizard: React.FC<NewRegistrationWizardProps> = ({
  onCancel,
  onSuccess,
  initialStudent,
  defaultRegistrationType = 'INITIAL_REGISTRATION',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(initialStudent ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1 State: Student
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(initialStudent || null);
  const [showCreateStudentForm, setShowCreateStudentForm] = useState(false);

  const [newStudentData, setNewStudentData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'Female',
    state: '',
    address: '',
    city: '',
    district: '',
    pincode: '',
    country: 'India',
    aadhar_number: '',
    alternate_phone: '',
    alternate_email: '',
  });

  // State update support for existing student missing State
  const [missingStudentState, setMissingStudentState] = useState('');
  const [isUpdatingStudentState, setIsUpdatingStudentState] = useState(false);
  const [stateUpdateSuccess, setStateUpdateSuccess] = useState(false);

  // Step 2 State: Authoritative Master Data & Registration Details
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [registrationType, setRegistrationType] = useState<RegistrationType>(defaultRegistrationType);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [notes, setNotes] = useState('');
  const [previewRegNumber, setPreviewRegNumber] = useState<string>('');

  // Step 2 Academic Background & Qualification Fields
  const [highestQualification, setHighestQualification] = useState('');
  const [selectedHighestQual, setSelectedHighestQual] = useState('');
  const [customHighestQual, setCustomHighestQual] = useState('');

  const [previousInstitution, setPreviousInstitution] = useState('');

  const [previousProgram, setPreviousProgram] = useState('');
  const [selectedPreviousProg, setSelectedPreviousProg] = useState('');
  const [customPreviousProg, setCustomPreviousProg] = useState('');

  const [yearOfCompletion, setYearOfCompletion] = useState('');
  const [qualificationRegNo, setQualificationRegNo] = useState('');
  const [previousRegistrationNumber, setPreviousRegistrationNumber] = useState('');

  const handleHighestQualSelect = (val: string) => {
    setSelectedHighestQual(val);
    if (val === 'Other') {
      setHighestQualification(customHighestQual);
    } else {
      setHighestQualification(val);
    }
  };

  const handleCustomHighestQualInput = (val: string) => {
    setCustomHighestQual(val);
    setHighestQualification(val);
  };

  const handlePreviousProgSelect = (val: string) => {
    setSelectedPreviousProg(val);
    if (val === 'Other') {
      setPreviousProgram(customPreviousProg);
    } else {
      setPreviousProgram(val);
    }
  };

  const handleCustomPreviousProgInput = (val: string) => {
    setCustomPreviousProg(val);
    setPreviousProgram(val);
  };


  // Dynamically resolve actual next Registration ID for Step 3 review
  useEffect(() => {
    if (selectedInstitutionId && selectedProgramId) {
      const inst = institutions.find((i) => i.id === selectedInstitutionId);
      const prog = programs.find((p) => p.id === selectedProgramId);
      if (inst?.code && prog?.code) {
        const year = extractYear(academicYear);
        generateRegistrationId(inst.code, prog.code, year)
          .then((res) => {
            setPreviewRegNumber(res.registrationNumber);
          })
          .catch(() => {
            setPreviewRegNumber(`${inst.code}/${prog.code}/${year}/1`);
          });
      }
    }
  }, [step, selectedInstitutionId, selectedProgramId, academicYear, institutions, programs]);

  // Load authoritative master data on mount
  useEffect(() => {
    async function loadMasterData() {
      try {
        const insts = await fetchInstitutions();
        setInstitutions(insts);
        if (insts.length > 0) {
          const firstInst = insts[0];
          setSelectedInstitutionId(firstInst.id);
          const depts = await fetchDepartments(firstInst.id);
          setDepartments(depts);
          const progs = await fetchProgramsForInstitution(firstInst.id);
          setPrograms(progs);
          if (progs.length > 0) {
            setSelectedProgramId(progs[0].id);
            if (progs[0].department_id) {
              setSelectedDepartmentId(progs[0].department_id);
            }
          } else if (depts.length > 0) {
            setSelectedDepartmentId(depts[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load master data hierarchy:', err);
      }
    }
    loadMasterData();
  }, []);

  const handleInstitutionChange = async (instId: string) => {
    setSelectedInstitutionId(instId);
    try {
      const depts = await fetchDepartments(instId);
      setDepartments(depts);
      const progs = await fetchProgramsForInstitution(instId);
      setPrograms(progs);
      if (progs.length > 0) {
        setSelectedProgramId(progs[0].id);
        if (progs[0].department_id) {
          setSelectedDepartmentId(progs[0].department_id);
        }
      } else if (depts.length > 0) {
        setSelectedDepartmentId(depts[0].id);
        setSelectedProgramId('');
      } else {
        setSelectedDepartmentId('');
        setSelectedProgramId('');
      }
    } catch (err) {
      console.error('Error switching institution:', err);
    }
  };

  const handleDepartmentChange = async (deptId: string) => {
    setSelectedDepartmentId(deptId);
    try {
      if (deptId) {
        const deptProgs = await fetchPrograms(deptId);
        setPrograms(deptProgs);
        if (deptProgs.length > 0 && !deptProgs.some((p) => p.id === selectedProgramId)) {
          setSelectedProgramId(deptProgs[0].id);
        }
      } else if (selectedInstitutionId) {
        const allProgs = await fetchProgramsForInstitution(selectedInstitutionId);
        setPrograms(allProgs);
        if (allProgs.length > 0 && !allProgs.some((p) => p.id === selectedProgramId)) {
          setSelectedProgramId(allProgs[0].id);
        }
      }
    } catch (err) {
      console.error('Error switching department:', err);
    }
  };

  const handleProgramChange = (progId: string) => {
    setSelectedProgramId(progId);
    const matched = programs.find((p) => p.id === progId);
    if (matched && matched.department_id) {
      setSelectedDepartmentId(matched.department_id);
    }
  };

  // Student search query on input change (only query when search input is provided)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const handleSearch = async () => {
      setIsSearching(true);
      try {
        const results = await fetchStudents(trimmed);
        setSearchResults(results);
      } catch (err) {
        console.error('Failed to search students:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // State update support for existing student missing State
  const handleUpdateStudentState = async () => {
    if (!selectedStudent || !missingStudentState) return;
    setIsUpdatingStudentState(true);
    setErrorMessage('');
    try {
      await updateStudent(selectedStudent.id, { state: missingStudentState });
      setSelectedStudent({ ...selectedStudent, state: missingStudentState });
      setStateUpdateSuccess(true);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(`Failed to update student state: ${err.message}`);
    } finally {
      setIsUpdatingStudentState(false);
    }
  };

  // Handle creating a new student with server-side authoritative Permanent UID
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.first_name?.trim() || !newStudentData.last_name?.trim() || !newStudentData.email?.trim()) {
      setErrorMessage('Please fill in required student fields (First Name, Last Name, Email).');
      return;
    }
    if (!newStudentData.state?.trim()) {
      setErrorMessage('State is required for every new registration submission.');
      return;
    }
    if (!newStudentData.date_of_birth) {
      setErrorMessage('Date of Birth is required for student registration.');
      return;
    }
    if (!newStudentData.phone?.trim()) {
      setErrorMessage('Phone Number is required for student registration.');
      return;
    }
    if (!newStudentData.aadhar_number?.trim()) {
      setErrorMessage('Aadhar Number / National ID is required for student registration.');
      return;
    }
    if (!newStudentData.country?.trim()) {
      setErrorMessage('Country is required for student registration.');
      return;
    }
    if (!newStudentData.address?.trim()) {
      setErrorMessage('Street Address is required for student registration.');
      return;
    }
    if (!newStudentData.city?.trim()) {
      setErrorMessage('City / Town is required for student registration.');
      return;
    }
    if (!newStudentData.pincode?.trim()) {
      setErrorMessage('PIN Code / Postal Code is required for student registration.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const intakeYear = extractYear(academicYear);
      const created = await createStudent(newStudentData, intakeYear);
      setSelectedStudent(created);
      setShowCreateStudentForm(false);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create student. Email may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Validation to proceed to Review Step 3
  const handleProceedToReview = () => {
    if (!selectedStudent) {
      setErrorMessage('Please select or create a student.');
      return;
    }
    // STATE REQUIREMENT: State is required for every NEW registration submission
    if (!selectedStudent.state || !selectedStudent.state.trim()) {
      setErrorMessage('State is required for every new registration. Please update the student profile with their state before proceeding.');
      return;
    }
    let effDeptId = selectedDepartmentId;
    if (!effDeptId && selectedProgramId) {
      const prog = programs.find((p) => p.id === selectedProgramId);
      if (prog?.department_id) {
        effDeptId = prog.department_id;
        setSelectedDepartmentId(effDeptId);
      }
    }
    if (!selectedInstitutionId || !effDeptId || !selectedProgramId) {
      setErrorMessage('Please select Institution, Department, and Program.');
      return;
    }
    // CONDITIONAL PREVIOUS REGISTRATION NUMBER ENFORCEMENT
    if (
      (registrationType === 'TRANSFER' ||
        registrationType === 'RE_REGISTRATION' ||
        registrationType === 'PROGRAM_PROGRESSION') &&
      (!previousRegistrationNumber || !previousRegistrationNumber.trim())
    ) {
      setErrorMessage(`Previous Registration Number is required for ${registrationType.replace(/_/g, ' ')}.`);
      return;
    }
    // REQUIRED QUALIFICATION & ACADEMIC BACKGROUND ENFORCEMENT
    if (!highestQualification || !highestQualification.trim()) {
      setErrorMessage('Highest Qualification is required. Please select an option or provide details under Other.');
      return;
    }
    if (!previousInstitution || !previousInstitution.trim()) {
      setErrorMessage('Previous Institution / College is required.');
      return;
    }
    if (!previousProgram || !previousProgram.trim()) {
      setErrorMessage('Previous Program / Course is required. Please select an option or provide details under Other.');
      return;
    }
    if (!yearOfCompletion || !yearOfCompletion.trim()) {
      setErrorMessage('Year of Completion is required.');
      return;
    }
    setErrorMessage('');
    setStep(3);
  };

  // Final Action: Save Draft or Submit Registration
  const handleFinalSave = async (status: WorkflowStatus) => {
    let effDeptId = selectedDepartmentId;
    if (!effDeptId && selectedProgramId) {
      const prog = programs.find((p) => p.id === selectedProgramId);
      if (prog?.department_id) {
        effDeptId = prog.department_id;
        setSelectedDepartmentId(effDeptId);
      }
    }
    if (!selectedStudent || !selectedInstitutionId || !effDeptId || !selectedProgramId) {
      setErrorMessage('Missing required registration data. Please ensure Institution, Department, and Program are selected.');
      return;
    }
    // STATE REQUIREMENT: State is required for every NEW registration submission
    if (!selectedStudent.state || !selectedStudent.state.trim()) {
      setErrorMessage('State is required for every new registration. Please update the student profile with their state before proceeding.');
      return;
    }
    // CONDITIONAL PREVIOUS REGISTRATION NUMBER ENFORCEMENT
    if (
      (registrationType === 'TRANSFER' ||
        registrationType === 'RE_REGISTRATION' ||
        registrationType === 'PROGRAM_PROGRESSION') &&
      (!previousRegistrationNumber || !previousRegistrationNumber.trim())
    ) {
      setErrorMessage(`Previous Registration Number is required for ${registrationType.replace(/_/g, ' ')}.`);
      return;
    }
    // REQUIRED QUALIFICATION & ACADEMIC BACKGROUND ENFORCEMENT
    if (!highestQualification || !highestQualification.trim()) {
      setErrorMessage('Highest Qualification is required. Please select an option or provide details under Other.');
      return;
    }
    if (!previousInstitution || !previousInstitution.trim()) {
      setErrorMessage('Previous Institution / College is required.');
      return;
    }
    if (!previousProgram || !previousProgram.trim()) {
      setErrorMessage('Previous Program / Course is required. Please select an option or provide details under Other.');
      return;
    }
    if (!yearOfCompletion || !yearOfCompletion.trim()) {
      setErrorMessage('Year of Completion is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const newRegistration = await createRegistration({
        student_id: selectedStudent.id,
        registration_type: registrationType,
        institution_id: selectedInstitutionId,
        department_id: effDeptId,
        program_id: selectedProgramId,
        academic_year: academicYear,
        status: status,
        notes: notes,
        highest_qualification: highestQualification.trim() || undefined,
        previous_institution: previousInstitution.trim() || undefined,
        previous_program: previousProgram.trim() || undefined,
        year_of_completion: yearOfCompletion.trim() || undefined,
        qualification_reg_no: qualificationRegNo.trim() || undefined,
        previous_registration_number: previousRegistrationNumber.trim() || undefined,
      });

      onSuccess(newRegistration);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to persist registration.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
      {/* Wizard Header Progress Bar */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 1
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
              }`}
            >
              1
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === 1 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
              }`}
            >
              Find Student
            </span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-3 ${
              step >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />

          {/* Step 2 Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 2
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === 2 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
              }`}
            >
              Registration Details
            </span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-3 ${
              step >= 3 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />

          {/* Step 3 Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 3
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
              }`}
            >
              3
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === 3 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
              }`}
            >
              Review & Submit
            </span>
          </div>
        </div>
      </div>

      {/* Form Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      <div className="p-6">
        {/* ======================================================== */}
        {/* STEP 1 — FIND OR CREATE STUDENT                           */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {showCreateStudentForm ? 'Create New Registration' : 'Step 1: Search Student Record'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {showCreateStudentForm
                    ? 'Fill in the details to create a new student record'
                    : 'Search for an existing student by Permanent UID, Name, Email, or Aadhar Number'}
                </p>
              </div>

              {!showCreateStudentForm && (
                <button
                  type="button"
                  onClick={() => setShowCreateStudentForm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-100 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Create New Student
                </button>
              )}
            </div>



            {/* CREATE NEW STUDENT FORM */}
            {showCreateStudentForm ? (
              <form onSubmit={handleCreateStudent} className="p-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-slate-800/50 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    New Student Details
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateStudentForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel & Return to Search
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* System UID Indicator */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Permanent Student UID <span className="text-slate-400 font-normal">(System-Generated)</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value="Auto-generated on creation (e.g. STU-YYYY-XXXXX)"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 p-2.5 font-mono text-xs font-semibold text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  {/* State of Residence — Mandatory for New Registration */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      State of Residence <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={newStudentData.state}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, state: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium"
                    >
                      <option value="">-- Select State * --</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Candidate's legal first name"
                      value={newStudentData.first_name}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, first_name: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Candidate's surname / family name"
                      value={newStudentData.last_name}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, last_name: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@example.com"
                      value={newStudentData.email}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, email: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudentData.phone}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, phone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newStudentData.date_of_birth}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, date_of_birth: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newStudentData.gender}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, gender: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Aadhar / National ID */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Aadhar Number / National ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="12-digit Indian Aadhar or government ID"
                      value={newStudentData.aadhar_number}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, aadhar_number: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Country <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudentData.country}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, country: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Street Address */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Street Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Door No, Street name, Locality"
                      value={newStudentData.address}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, address: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* City, District, PIN Code */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City / Town <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bangalore"
                      value={newStudentData.city}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, city: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore Urban"
                      value={newStudentData.district}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, district: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      PIN Code / Postal Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 560077"
                      value={newStudentData.pincode}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, pincode: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>


                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Alternate Phone <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Secondary contact number"
                      value={newStudentData.alternate_phone}
                      onChange={(e) =>
                        setNewStudentData({ ...newStudentData, alternate_phone: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>


                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving Student...' : 'Save & Proceed'}
                  </button>
                </div>
              </form>
            ) : (
              /* SEARCH EXISTING STUDENTS LIST */
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Permanent UID, Name, Email, or Aadhar Number..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Searching student directory...
                    </div>
                  ) : !searchQuery.trim() ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                      <Search className="h-6 w-6 text-slate-400 mx-auto mb-2 opacity-60" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Search for an existing student record
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Enter a Permanent UID, Name, Email, or Aadhar Number in the search box above.
                      </p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                      No matching student records found for &ldquo;{searchQuery.trim()}&rdquo;.
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateStudentForm(true)}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Click here to create a new student record
                        </button>
                      </div>
                    </div>
                  ) : (
                    searchResults.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => {
                          setSelectedStudent(st);
                          setStep(2);
                        }}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600 transition-colors">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                              {st.first_name} {st.last_name}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono">
                              UID: {st.permanent_uid} | {st.email}
                              {(st.aadhar_number || st.national_id) && (
                                <> | Aadhar: {maskAadhar(st.aadhar_number || st.national_id)}</>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-slate-400 group-hover:text-blue-600 transition-colors">
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Bottom Navigation Step 1 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2 — REGISTRATION DETAILS                             */}
        {/* ======================================================== */}
        {step === 2 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {selectedStudent && (
              <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600 text-white">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold uppercase">
                      Registering Candidate
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      UID: {selectedStudent.permanent_uid} | {selectedStudent.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedStudent.state ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <MapPin className="h-3 w-3" /> State: {selectedStudent.state}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <AlertCircle className="h-3 w-3" /> State Missing (Update Required)
                        </span>
                      )}
                      {selectedStudent.national_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <CreditCard className="h-3 w-3" /> Aadhar: {selectedStudent.national_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change Student
                </button>
              </div>
            )}

            {/* ACTION REQUIRED: Missing State Enforcement Banner for Existing Student */}
            {selectedStudent && (!selectedStudent.state || !selectedStudent.state.trim()) && (
              <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs shadow-xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wide">
                      State Required for Registration Submission
                    </h5>
                    <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                      Under ATA regulations, <strong>State is required for every new registration submission</strong>.
                      This existing student profile does not currently contain a State of residence.
                      Please select their state below and update the profile before proceeding.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <select
                    value={missingStudentState}
                    onChange={(e) => setMissingStudentState(e.target.value)}
                    className="rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Select Candidate's State of Residence * --</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!missingStudentState || isUpdatingStudentState}
                    onClick={handleUpdateStudentState}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isUpdatingStudentState ? 'Updating Profile...' : 'Save State to Student Profile'}
                  </button>
                </div>
                {stateUpdateSuccess && (
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Student profile updated with state successfully! You may now proceed.
                  </p>
                )}
              </div>
            )}

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 2: Registration & Academic Placement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Specify registration classification, previous academic history, and institutional placement
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Registration Type */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { type: 'INITIAL_REGISTRATION', label: 'Initial Registration' },
                    { type: 'RE_REGISTRATION', label: 'Re-Registration' },
                    { type: 'TRANSFER', label: 'Transfer' },
                    { type: 'PROGRAM_PROGRESSION', label: 'Program Progression' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setRegistrationType(item.type as RegistrationType)}
                      className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                        registrationType === item.type
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Previous Registration Number */}
              {(registrationType === 'TRANSFER' ||
                registrationType === 'RE_REGISTRATION' ||
                registrationType === 'PROGRAM_PROGRESSION') && (
                <div className="sm:col-span-2 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Previous Registration Record <span className="text-rose-500">*</span>
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Mandatory for <strong>{registrationType.replace(/_/g, ' ')}</strong> candidates. Enter their existing ATA Registration Number or previous institutional enrollment ID.
                  </p>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Previous Registration Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={previousRegistrationNumber}
                      onChange={(e) => setPreviousRegistrationNumber(e.target.value)}
                      placeholder="e.g. SABC/BTH/2024/12 or historical registration ID"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Academic Background & Qualifications Section */}
              <div className="sm:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Candidate Prior Academic Qualification
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Record the candidate's highest completed academic qualification level and previous course details.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Highest Qualification */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Highest Qualification <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedHighestQual}
                      onChange={(e) => handleHighestQualSelect(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Highest Qualification * --</option>
                      {HIGHEST_QUALIFICATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {selectedHighestQual === 'Other' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          placeholder="Enter your highest qualification details *"
                          value={customHighestQual}
                          onChange={(e) => handleCustomHighestQualInput(e.target.value)}
                          className="w-full rounded-lg border border-blue-400 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Previous Institution / College */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Previous Institution / College <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="previous-institutions-list"
                      required
                      value={previousInstitution}
                      onChange={(e) => setPreviousInstitution(e.target.value)}
                      placeholder="e.g. St. Stephen's College / Berean Bible College"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <datalist id="previous-institutions-list">
                      {INSTITUTION_NAMES.map((instName) => (
                        <option key={instName} value={instName} />
                      ))}
                    </datalist>
                  </div>

                  {/* Previous Program / Course */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Previous Program / Course <span className="text-rose-500">*</span>
                    </label>
                    {(() => {
                      const relevantCats = selectedHighestQual ? getCategoriesForHighestQualification(selectedHighestQual) : [];
                      const matchingProgs = relevantCats.flatMap((cat) => PREVIOUS_PROGRAMS_BY_CATEGORY[cat] || []);
                      const otherCats = Object.keys(PREVIOUS_PROGRAMS_BY_CATEGORY).filter(
                        (cat) => !relevantCats.includes(cat)
                      );

                      return (
                        <select
                          required
                          value={selectedPreviousProg}
                          onChange={(e) => handlePreviousProgSelect(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">
                            {selectedHighestQual && selectedHighestQual !== 'Other'
                              ? `-- Select Course for ${selectedHighestQual} * --`
                              : '-- Select Previous Program / Course * --'}
                          </option>

                          {selectedHighestQual && selectedHighestQual !== 'Other' && matchingProgs.length > 0 ? (
                            <>
                              <optgroup label={`Matching Programs for ${selectedHighestQual} (${matchingProgs.length})`}>
                                {matchingProgs.map((prog) => (
                                  <option key={prog} value={prog}>
                                    {prog}
                                  </option>
                                ))}
                              </optgroup>
                              {otherCats.length > 0 && (
                                <optgroup label="Other Levels / Programs">
                                  {otherCats.flatMap((cat) => PREVIOUS_PROGRAMS_BY_CATEGORY[cat] || []).map((prog) => (
                                    <option key={prog} value={prog}>
                                      {prog}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </>
                          ) : (
                            Object.entries(PREVIOUS_PROGRAMS_BY_CATEGORY).map(([cat, progs]) => (
                              <optgroup key={cat} label={cat}>
                                {progs.map((prog) => (
                                  <option key={prog} value={prog}>
                                    {prog}
                                  </option>
                                ))}
                              </optgroup>
                            ))
                          )}

                          <option value="Other">Other (Specify below)</option>
                        </select>
                      );
                    })()}
                    {selectedPreviousProg === 'Other' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          placeholder="Enter your previous program / course details *"
                          value={customPreviousProg}
                          onChange={(e) => handleCustomPreviousProgInput(e.target.value)}
                          className="w-full rounded-lg border border-blue-400 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Year of Completion */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Year of Completion <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={yearOfCompletion}
                      onChange={(e) => setYearOfCompletion(e.target.value)}
                      placeholder="e.g. 2024"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Qualification Registration / Roll Number
                    </label>
                    <input
                      type="text"
                      value={qualificationRegNo}
                      onChange={(e) => setQualificationRegNo(e.target.value)}
                      placeholder="e.g. Roll or certificate enrollment number"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Current Academic Placement & Program Registration Section */}
              <div className="sm:col-span-2 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Current Program Registration & Institutional Placement
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Select the authoritative institution, department, and academic program the student is registering for now.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Institution Dropdown */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Institution <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedInstitutionId}
                      onChange={(e) => handleInstitutionChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {institutions.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} ({inst.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department Dropdown (Cascading) */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {departments.length > 1 && (
                        <option value="">All Departments ({departments.length})</option>
                      )}
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Program Dropdown (Cascading) */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Program <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedProgramId}
                      onChange={(e) => handleProgramChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {programs.length === 0 && (
                        <option value="">No programs available</option>
                      )}
                      {programs.map((prog) => (
                        <option key={prog.id} value={prog.id}>
                          {prog.name} ({prog.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Academic Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="2026-2027">2026-2027</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2027-2028">2027-2028</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Additional Registration Notes
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter initial registration details or applicant observations..."
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>


            {/* Bottom Navigation Step 2 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Student Search
              </button>

              <button
                type="button"
                onClick={handleProceedToReview}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Proceed to Review
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3 — REVIEW SUMMARY & SAVE DRAFT / SUBMIT             */}
        {/* ======================================================== */}
        {step === 3 && selectedStudent && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 3: Review & Finalize Registration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify all candidate and academic placement details before persisting
              </p>
            </div>

            {/* Candidate Profile & Address Summary Card */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-6 space-y-4">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Candidate Profile
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h4>
                  <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                    Permanent UID: {selectedStudent.permanent_uid} | {selectedStudent.email}
                  </p>
                </div>
                <div>
                  {selectedStudent.state ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <MapPin className="h-3.5 w-3.5" /> {selectedStudent.state}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      <AlertCircle className="h-3.5 w-3.5" /> State Missing
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="block text-slate-400 font-medium">Contact Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedStudent.phone || '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Date of Birth</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedStudent.date_of_birth || '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Gender</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedStudent.gender || '—'}
                  </span>
                </div>
                {selectedStudent.national_id && (
                  <div>
                    <span className="block text-slate-400 font-medium">Aadhar / National ID</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {selectedStudent.national_id}
                    </span>
                  </div>
                )}
                {(selectedStudent.city || selectedStudent.district) && (
                  <div>
                    <span className="block text-slate-400 font-medium">City / District</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {[selectedStudent.city, selectedStudent.district].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {selectedStudent.pincode && (
                  <div>
                    <span className="block text-slate-400 font-medium">PIN Code</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {selectedStudent.pincode}
                    </span>
                  </div>
                )}
                {selectedStudent.address && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="block text-slate-400 font-medium">Street Address</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {selectedStudent.address}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Candidate Prior Qualifications Card */}
            {(highestQualification || previousInstitution || previousProgram || yearOfCompletion || qualificationRegNo) && (
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-6 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Prior Academic Background
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  {highestQualification && (
                    <div>
                      <span className="block text-slate-400 font-medium">Highest Qualification</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {highestQualification}
                      </span>
                    </div>
                  )}
                  {previousInstitution && (
                    <div>
                      <span className="block text-slate-400 font-medium">Previous Institution</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {previousInstitution}
                      </span>
                    </div>
                  )}
                  {previousProgram && (
                    <div>
                      <span className="block text-slate-400 font-medium">Previous Program</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {previousProgram}
                      </span>
                    </div>
                  )}
                  {yearOfCompletion && (
                    <div>
                      <span className="block text-slate-400 font-medium">Year of Completion</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {yearOfCompletion}
                      </span>
                    </div>
                  )}
                  {qualificationRegNo && (
                    <div>
                      <span className="block text-slate-400 font-medium">Qualification Reg / Roll No</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {qualificationRegNo}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Academic Placement Summary Card */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-6 space-y-4">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Placement & Registration Summary
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {programs.find((p) => p.id === selectedProgramId)?.name || selectedProgramId}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-slate-400 font-medium">Registration Type</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {registrationType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Academic Year</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {academicYear}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Institution</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {institutions.find((i) => i.id === selectedInstitutionId)?.name || selectedInstitutionId}
                    {institutions.find((i) => i.id === selectedInstitutionId)?.code ? ` (${institutions.find((i) => i.id === selectedInstitutionId)?.code})` : ''}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Department</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {departments.find((d) => d.id === selectedDepartmentId)?.name || selectedDepartmentId}
                    {departments.find((d) => d.id === selectedDepartmentId)?.code ? ` (${departments.find((d) => d.id === selectedDepartmentId)?.code})` : ''}
                  </span>
                </div>
                {previousRegistrationNumber && (
                  <div className="col-span-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="block text-slate-400 font-medium text-[10px] uppercase tracking-wider">
                      Previous Registration Number
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      {previousRegistrationNumber}
                    </span>
                  </div>
                )}
                <div className="col-span-2 p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                  <span className="block text-slate-400 font-medium text-[10px] uppercase tracking-wider">
                    Registration ID Preview
                  </span>
                  <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-300">
                    {previewRegNumber ||
                      (institutions.find((i) => i.id === selectedInstitutionId)?.code && programs.find((p) => p.id === selectedProgramId)?.code
                        ? `${institutions.find((i) => i.id === selectedInstitutionId)?.code}/${programs.find((p) => p.id === selectedProgramId)?.code}/${extractYear(academicYear)}/1`
                        : 'Authoritative ID generated upon submission')}
                  </span>
                </div>
                {notes && (
                  <div className="col-span-2">
                    <span className="block text-slate-400 font-medium">Notes</span>
                    <span className="text-slate-600 dark:text-slate-400 italic">{notes}</span>
                  </div>
                )}
              </div>
            </div>


            {/* Bottom Actions: Save Draft vs Submit */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Edit Details
              </button>

              <div className="flex items-center gap-3">
                {/* SAVE DRAFT */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSave('DRAFT')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Save className="h-4 w-4 text-slate-500" />
                  SAVE DRAFT
                </button>

                {/* SUBMIT REGISTRATION */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSave('SUBMITTED')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-md shadow-blue-500/20"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Persisting to Supabase...' : 'SUBMIT REGISTRATION'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
