import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { EstadoBr } from './../shared/models/estado-br.model'
import { DropdownService } from './../shared/services/dropdown.service';
import { ConsultaCepService } from './../shared/services/consulta-cep.service';
import { FormValidations } from '../shared/form-validations';
import { VerificaEmailService } from './services/verifica-email.service';
import { map, tap, distinctUntilChanged, switchMap} from 'rxjs/operators';
import { BaseFormComponent } from './../shared/base-form/base-form.component';
import { Cidade } from '../shared/models/cidade';
import { empty } from 'rxjs';

@Component({
  selector: 'app-data-form',
  templateUrl: './data-form.component.html',
  styleUrls: ['./data-form.component.css'],
})
export class DataFormComponent extends BaseFormComponent implements OnInit {

  cidades!: Cidade[] ;
  estados!: EstadoBr[] ;
  cargos: any = [];
  tecnologias: any = [];
  newsletterOp: any = [];

  frameworks = ['Angular', 'React', 'CSharp', 'Pyton'];
  //injetando formBuilder no construtor
  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private dropdownService: DropdownService,
    private cepService: ConsultaCepService,
    private verificaEmailService: VerificaEmailService
  ) {
    super();
  }

  override ngOnInit(): void {
    // this.verificaEmailService.verificarEmail('teste@email.com').subscribe();
    // this.estados = this.dropdownService.getEstadosBr(); //COM PIPE ASYNC
    this.dropdownService.getEstadosBr().subscribe(dados => this.estados = dados);
    this.cargos = this.dropdownService.getCargos();
    this.tecnologias = this.dropdownService.getTecnologias();
    this.newsletterOp = this.dropdownService.getNewsletter();

    // this.dropdownService.getEstadosBr().subscribe (dados => {
    //   this.estados = dados;
    //   console.log(dados)
    // });

    //ÉSSA É A MANEIRA DE FAZER COM FORMGROUP não precisa injetar no construtor
    /* this.formulario = new FormGroup({
      nome: new FormControl(null),
      email: new FormControl(null)
    });*/

    //ESSA É A MANEIRA DE FAZER COM FORMBUILDER precisa injetar no construtor
    this.formulario = this.formBuilder.group({
      nome: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: [null, [Validators.required, Validators.email], [this.validarEmail.bind(this)]],
      confirmarEmail: [null, [FormValidations.equalsTo('email')]],

      endereco: this.formBuilder.group({
        cep: [null, [Validators.required, FormValidations.cepValidator]],
        numero: [null, Validators.required],
        complemento: [null],
        rua: [null, Validators.required],
        bairro: [null, Validators.required],
        cidade: [null, Validators.required],
        estado: [null, Validators.required],
      }),
      cargo: [null],
      tecnologias: [null],
      newsLetter: ['s'],
      termos: [null, Validators.pattern('true')],//validando tioo togle no angular
      frameworks: this.buildFrameworks()
    });

    this.formulario.get('endereco.cep').statusChanges
      .pipe(
        distinctUntilChanged(),
        tap((value: any) => console.log('status do CEP:', value)),
        switchMap(status => status === 'VALID'
          ? this.cepService.consultaCEP( this.formulario.get('endereco.cep').value)
          : empty()
        )
      )
      .subscribe((dados: any) => dados ? this.populaDadosForm(dados) : {});
      // this.dropdownService.getCidades(8).subscribe(console.log);

      this.formulario.get('endereco.estado').valueChanges
      .pipe(
        tap(estado => console.log('Novo estado: ', estado)),
        map(estado => this.estados.filter((e: any) => e.sigla === estado)),
        map(estados => this.estados && this.estados.length > 0 ? this.estados[0].id :empty()),
        switchMap((estadoId: number) => this.dropdownService.getCidades(estadoId)),
        tap(console.log)
      )
      .subscribe((cidades: any) => this.cidades = cidades);

      }

  buildFrameworks(){
      const values = this.frameworks.map(v => new FormControl(false));
      return this.formBuilder.array(values);

      //  this.formBuilder.array([
      //   new FormControl(false),
      //   new FormControl(false),
      //   new FormControl(false),
      //   new FormControl(false),
      // ]);
  }

  override submit(): void {
    console.log(this.formulario);

    let valueSubmit = Object.assign({}, this.formulario.value);

    valueSubmit = Object.assign(valueSubmit, {
      frameworks: valueSubmit.frameworks
      .map((v: any, i: any) => v ? this.frameworks[i] : null)
      .filter((v: null) => v !== null)
    })
    console.log(valueSubmit);

    this.http
    .post('https://httpbin.org/post', JSON.stringify({}))
    .subscribe(
      dados => {console.log(dados);
      },
      // this.resetar();
        //RESETANDO O FORMULARIO
      (error: any) => alert('erro')
    );
  }

  consultaCEP() {
    const cep = this.formulario.get('endereco.cep').value;

    if (cep != null && cep !== '') {
      this.cepService
        .consultaCEP( cep )
        .subscribe((dados) => this.populaDadosForm(dados));
    }
  }

  populaDadosForm(dados: any) {
    this.formulario.patchValue({
      endereco: {
        cep: dados.cep,
        rua: dados.logradouro,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.localidade,
        estado: dados.uf,
      },
    });
  }

  resetaDadosForm() {
    this.formulario.patchValue({
      endereco: {
        rua: null,
        complemento: null,
        bairro: null,
        cidade: null,
        estado: null,
      },
    });
  }

  setarCargo(){
    const cargo = { nome: 'Dev', nivel: 'Pleno', desc: 'Dev Pl'};
    this.formulario.get('cargo').setValue(cargo);
  }

  compararCargos(obj1: any, obj2: any){
    return obj1 && obj2 ? (obj1.nome === obj2.nome && obj1.nivel === obj2.nivel) : obj1 === obj2;
  }

  setarTecnologias(){
    this.formulario.get('tecnologias').setValue(['Java', 'JavaScript', 'Php']);
  }

  // VALIDAÇÃO DE EMAIL
  validarEmail(formControl: FormControl){ //ISSO É UMA VALIDAÇÃO ACINCRONA
    return this.verificaEmailService.verificarEmail(formControl.value)
      .pipe(map(emailExiste => emailExiste ? { emailInvalido: true} : null));
  }


}
