import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { config } from 'rxjs';

export class FormValidations {
  static requiredMinCheckbox(min = 1) {
    const validator = (formArray: AbstractControl) => {
      //ESSE CODIGO É O MESMO DE CIMA SÓ QUE MAIS FUNCIONAL
      if (formArray instanceof FormArray) {
        const totalChecked = formArray.controls
          .map((v) => v.value)
          .reduce((total, current) => (current ? total + current : total), 0);
        return totalChecked >= min ? null : { required: true };
      }

      return validator;
    };
  }

  static cepValidator( control: FormControl){
    const cep = control.value;
    if (cep && cep !== '') {
      const validacep = /^[0-9]{8}$/
      return validacep.test(cep) ? null : { cepInvalido: true };
    }
    return null;
  }

  static equalsTo(otherfield: string){
    const validator = (formControl: FormControl) => {
      if (otherfield == null){
        throw new Error('É necessario informar um campo.');
      }

      if (!formControl.root || !(<FormGroup>formControl.root).controls) {
        return null;
      }
      const field = (<FormGroup>formControl.root).get(otherfield);
      if (!field) {
        throw new Error ('É necessario informar um campo válido');
      }

      if (field.value !== formControl.value) {
        return { equalsTo: otherfield }
      }
      return null;
    }
    return validator;
  }

  static getErrorMsg(fieldName: string, validatorName: any, validatorValue?: any){
    const config: any = {
      'required': `${fieldName} é obrigatório.`,
      'minlength': `${fieldName} precisa ter no mínimo ${validatorValue.requiredLength} caracteres.`,
      'maxlength': `${fieldName} precisa ter no máximo ${validatorValue.requiredLength} caracteres.`,
      'cepInvalido': 'CEP inválido.',
      'emailInvalido': 'Email já cadastrado!',
      'equalsto': 'Campos não são iguais.',
      'pattern': 'Campo inválido.'
    };

    return config [validatorName];

  }
}
