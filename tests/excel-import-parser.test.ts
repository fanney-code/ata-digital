import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { parseExcelWorkbook, parseWorksheet } from '../lib/utils/excel-parser';

describe('Real-World ATA Excel Registration Sheet Parser Suite', () => {
  const sampleFilePath = 'C:\\Users\\fanne\\Desktop\\ATA Resources\\GHTI-2024-ATA REGD-PS (REVISED 1).xls';

  it('1: Correctly identifies all program sheets and ignores fee summary sheet', () => {
    if (!fs.existsSync(sampleFilePath)) {
      console.log('Sample file not found at path, skipping direct file test');
      return;
    }

    const workbook = XLSX.readFile(sampleFilePath);
    const result = parseExcelWorkbook(workbook, 'GHTI-2024-ATA REGD-PS (REVISED 1).xls');

    // Expected student sheets: DipTh, BTh, MDiv. "REGD FEE" should be excluded from student sheets.
    assert.equal(result.sheets.length, 3, 'Should have exactly 3 student sheets');
    const sheetNames = result.sheets.map((s) => s.sheetName.trim());
    assert.ok(sheetNames.includes('DIPLOMA IN THEOLOGY'));
    assert.ok(sheetNames.includes('BACHELOR OF THEOLOGY'));
    assert.ok(sheetNames.includes('MASTER OF DIVINITY'));

    // Verify detected institution
    assert.equal(result.detectedInstitution, 'Great Harvest Theological Institute');
    assert.equal(result.detectedAcademicYear, '2024-2025');
  });

  it('2: Parses Diploma in Theology with exact real student names, genders, and states', () => {
    if (!fs.existsSync(sampleFilePath)) return;

    const workbook = XLSX.readFile(sampleFilePath);
    const sheet = workbook.Sheets['DIPLOMA IN THEOLOGY'];
    const parsed = parseWorksheet(sheet, 'DIPLOMA IN THEOLOGY');

    // Must be exactly 22 real students (no dummy students 23-28)
    assert.equal(parsed.studentCount, 22, 'Diploma in Theology must have exactly 22 students');

    const first = parsed.rows[0];
    assert.equal(first.first_name, 'Abhishek');
    assert.equal(first.last_name, 'Sonar');
    assert.equal(first.gender, 'Male');
    assert.equal(first.state, 'West Bengal');
    assert.equal(first.program_name, 'Diploma in Theology');
    assert.equal(first.institution_name, 'Great Harvest Theological Institute');
    assert.equal(first.academic_year, '2024-2025');
    assert.equal(first.highest_qualification, '10th PASS');
    assert.equal(first.registration_number, 'GHTI/DIP.TH/2024/1');

    // Check last student
    const last = parsed.rows[21];
    assert.equal(last.first_name, 'Vishal');
    assert.equal(last.last_name, 'Kumar');
    assert.equal(last.gender, 'Male');
    assert.equal(last.state, 'Bihar');
    assert.equal(last.registration_number, 'GHTI/DIP.TH/2024/22');

    // Ensure no rows contain 'Student 1' or 'student.1_1@student.edu'
    parsed.rows.forEach((r) => {
      assert.notEqual(r.first_name, 'Student');
      assert.ok(!r.email?.includes('student.1_1@student.edu'));
    });
  });

  it('3: Parses Bachelor of Theology with multi-row entrance qualifications and ATA reg numbers', () => {
    if (!fs.existsSync(sampleFilePath)) return;

    const workbook = XLSX.readFile(sampleFilePath);
    const sheet = workbook.Sheets['BACHELOR OF THEOLOGY'];
    const parsed = parseWorksheet(sheet, 'BACHELOR OF THEOLOGY');

    assert.equal(parsed.studentCount, 22, 'Bachelor of Theology must have exactly 22 students');

    const first = parsed.rows[0];
    assert.equal(first.first_name, 'Amos');
    assert.equal(first.last_name, '');
    assert.equal(first.gender, 'Male');
    assert.equal(first.state, 'Punjab');
    assert.equal(first.program_name, 'Bachelor of Theology');
    assert.equal(first.registration_number, 'GHTI/BTH/2024/1');

    // Check student with 2-year DipTh entrance and previous reg number
    const govada = parsed.rows[5]; // Row 12 in sheet, index 5
    assert.equal(govada.first_name, 'Govada');
    assert.equal(govada.last_name, 'Suhith Dani');
    assert.ok(govada.highest_qualification?.includes('2 Years DIP.TH PASS'));
  });

  it('4: Parses Master of Divinity and identifies transfers with previous registration numbers', () => {
    if (!fs.existsSync(sampleFilePath)) return;

    const workbook = XLSX.readFile(sampleFilePath);
    const sheet = workbook.Sheets['MASTER OF DIVINITY '];
    const parsed = parseWorksheet(sheet, 'MASTER OF DIVINITY');

    assert.equal(parsed.studentCount, 11, 'Master of Divinity must have exactly 11 students');

    // Student 1 is a transferred student from AG TN
    const transferStudent = parsed.rows[0];
    assert.equal(transferStudent.first_name, 'Allakonda');
    assert.equal(transferStudent.last_name, 'Rajender');
    assert.equal(transferStudent.state, 'Telangana');
    assert.equal(transferStudent.registration_type, 'TRANSFER');
    assert.equal(transferStudent.previous_registration_number, 'RBCS/MDIV/2023/2');

    // Check female student
    const femaleStudent = parsed.rows[5]; // Madhu
    assert.equal(femaleStudent.first_name, 'Madhu');
    assert.equal(femaleStudent.gender, 'Female');
    assert.equal(femaleStudent.state, 'Punjab');
  });

  it('5: Standard flat template Excel sheet continues to parse seamlessly', () => {
    const standardData = [
      {
        'First Name': 'Sophia',
        'Last Name': 'Chen',
        Email: 'sophia.chen@example.edu',
        Phone: '+91 98765 43210',
        State: 'Karnataka',
        Institution: 'New India Bible Seminary',
        Program: 'Bachelor of Theology',
        'Academic Year': '2026-2027',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(standardData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    const result = parseExcelWorkbook(wb, 'standard.xlsx');
    assert.equal(result.allStudentRows.length, 1);
    assert.equal(result.allStudentRows[0].first_name, 'Sophia');
    assert.equal(result.allStudentRows[0].last_name, 'Chen');
    assert.equal(result.allStudentRows[0].email, 'sophia.chen@example.edu');
    assert.equal(result.allStudentRows[0].state, 'Karnataka');
  });
});
