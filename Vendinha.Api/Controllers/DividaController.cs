using Microsoft.AspNetCore.Mvc;
using Vendinha.Models;
using Vendinha.Services;

namespace Vendinha.Api.Controllers
{
    // As dívidas sempre pertencem a um cliente: api/cliente/5/divida
    [Route("api/cliente/{clienteId:int}/divida")]
    public class DividaController : ControllerBase
    {
        private readonly DividaService service;

        public DividaController(DividaService service)
        {
            this.service = service;
        }

        // GET api/cliente/5/divida
        [HttpGet]
        public IActionResult Listar(int clienteId)
        {
            if (!service.ClienteExiste(clienteId))
            {
                return NotFound();
            }
            return Ok(service.Listar(clienteId));
        }

        // GET api/cliente/5/divida/12
        [HttpGet("{dividaId:int}")]
        public IActionResult Obter(int clienteId, int dividaId)
        {
            var divida = service.Obter(clienteId, dividaId);
            if (divida == null)
            {
                return NotFound();
            }
            return Ok(divida);
        }

        // POST api/cliente/5/divida   corpo: { "valor": 25.50 }
        [HttpPost]
        public IActionResult Cadastrar(int clienteId, [FromBody] Divida divida)
        {
            if (divida == null)
            {
                return BadRequest("Corpo da requisição ausente ou inválido.");
            }
            if (!service.ClienteExiste(clienteId))
            {
                return NotFound();
            }

            var sucesso = service.Criar(clienteId, divida, out var erros);
            if (sucesso)
            {
                return CreatedAtAction(nameof(Obter),
                    new { clienteId, dividaId = divida.Id }, divida);
            }
            return UnprocessableEntity(erros);
        }

        // PUT api/cliente/5/divida/12/pagamento  (marca como paga)
        [HttpPut("{dividaId:int}/pagamento")]
        public IActionResult Pagar(int clienteId, int dividaId)
        {
            var divida = service.Obter(clienteId, dividaId);
            if (divida == null)
            {
                return NotFound();
            }

            var sucesso = service.Pagar(divida, out var erros);
            if (sucesso)
            {
                return Ok(divida);
            }
            return UnprocessableEntity(erros);
        }
    }
}
