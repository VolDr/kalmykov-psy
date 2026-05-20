import { fail } from '@sveltejs/kit';
import { MAILOPOST_API_TOKEN } from '$env/static/private';

export const actions = {
    sendResults: async ({ request }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();

        if (!email || !email.includes('@')) {
            return fail(400, { success: false });
        }

        try {
            const params = {
                score: data.get('score')?.toString() || '',
                severity: data.get('severity')?.toString() || '',
                total_recommendation: data.get('total_recommendation')?.toString() || '',
                color: data.get('color')?.toString() || '#191919',
                
                sub0_name: data.get('sub0_name')?.toString() || '',
                sub0_score: data.get('sub0_score')?.toString() || '',
                sub0_severity: data.get('sub0_severity')?.toString() || '',
                sub0_desc: data.get('sub0_desc')?.toString() || '',
                sub0_color: data.get('sub0_color')?.toString() || '#191919',
                
                sub1_name: data.get('sub1_name')?.toString() || '',
                sub1_score: data.get('sub1_score')?.toString() || '',
                sub1_severity: data.get('sub1_severity')?.toString() || '',
                sub1_desc: data.get('sub1_desc')?.toString() || '',
                sub1_color: data.get('sub1_color')?.toString() || '#191919',
                
                sub2_name: data.get('sub2_name')?.toString() || '',
                sub2_score: data.get('sub2_score')?.toString() || '',
                sub2_severity: data.get('sub2_severity')?.toString() || '',
                sub2_desc: data.get('sub2_desc')?.toString() || '',
                sub2_color: data.get('sub2_color')?.toString() || '#191919',
                
                sub3_name: data.get('sub3_name')?.toString() || '',
                sub3_score: data.get('sub3_score')?.toString() || '',
                sub3_severity: data.get('sub3_severity')?.toString() || '',
                sub3_desc: data.get('sub3_desc')?.toString() || '',
                sub3_color: data.get('sub3_color')?.toString() || '#191919'
            };

            const response = await fetch(`https://api.mailopost.ru/v1/email/templates/1850507/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MAILOPOST_API_TOKEN}`
                },
                body: JSON.stringify({
                    to: email,
                    params: params
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Ошибка Mailopost API:', errorData);
                throw new Error('Mailopost API Error');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Email background send error:', error);
            return fail(500, { success: false });
        }
    }
};