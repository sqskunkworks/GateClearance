import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Received complete application data');
    
    const { applicationId, ssnFull, ssnMethod, ssnFirstFive, wardenLetter, digitalSignature, ...formData } = body;
    
    const convertDate = (dateStr: string | undefined) => {
      if (!dateStr) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [month, day, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
      }
      return null;
    };

    const applicationData = {
      id: applicationId,
      user_id: 'test-user',
      
      // Personal info
      first_name: formData.firstName,
      last_name: formData.lastName,
      other_names: formData.otherNames,
      date_of_birth: convertDate(formData.dateOfBirth),
      gender: formData.gender,
      
      // Contact info
      email: formData.email,
      phone_number: formData.phoneNumber,
      company_or_organization: formData.companyOrOrganization,  // ✅ Fixed
      purpose_of_visit: formData.purposeOfVisit,
      
      // Security info
      government_id_type: formData.governmentIdType,
      government_id_number: formData.governmentIdNumber,
      id_state: formData.idState,
      id_expiration: convertDate(formData.idExpiration),
      digital_signature: digitalSignature,  // ✅ Fixed
      
      // Boolean fields
      former_inmate: formData.formerInmate === 'yes',
      on_probation_parole: formData.onParole === 'yes',
      visited_inmate: formData.visitedInmate === 'yes',
      restricted_access: formData.restrictedAccess === 'yes',
      felony_conviction: formData.felonyConviction === 'yes',
      pending_charges: formData.pendingCharges === 'yes',
      
      // Authorization type
      authorization_type: 'Gate Clearance',
      
      // Status fields
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };
    
    console.log('💾 Inserting into database...');
    
    const { data, error } = await supabase
      .from('applications')
      .upsert(applicationData, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint },
        { status: 500 }
      );
    }
    
    console.log('✅ Application saved successfully:', data.id);
    
    return NextResponse.json({
      success: true,
      applicationId: data.id,
      message: 'Application submitted successfully',
    });
    
  } catch (error: any) {
    console.error('❌ Error saving application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save application' },
      { status: 500 }
    );
  }
}